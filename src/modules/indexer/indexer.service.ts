import { FuelMessagePortal__factory } from '@/types/solidity';
import {
  HypersyncClient,
  presetQueryLogsOfEvent,
} from '@envio-dev/hypersync-client';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EthService } from '../eth/eth.service';
import { L1toL2MessageType } from '@/types';
import { FuelService } from '../fuel/fuel.service';
import { LogDescription } from 'ethers';
import EthL1L2MessagesRepository from './eth.l1l2.messages.repository';
import { ClientSession } from 'mongoose';

const iface = FuelMessagePortal__factory.createInterface();
const MESSAGE_SENT_EVENT_HASH = iface.getEvent('MessageSent').topicHash;

@Injectable()
export class IndexerService {
  constructor(
    private readonly configService: ConfigService,
    private readonly ethService: EthService,
    private readonly fuelService: FuelService,
    private readonly ethL1L2Messages: EthL1L2MessagesRepository,
  ) {}

  public async indexL1toL2Messages(
    from: number,
    to: number,
    session?: ClientSession,
  ) {
    let messages: L1toL2MessageType[];
    if (this.envioEnabled()) {
      messages = await this.getL1toL2MessagesWithEnvio(from, to);
    } else {
      messages = await this.getL1toL2MessagesWithRpc(from, to);
    }

    const newEntries = await this.ethL1L2Messages.createMany(messages, session);

    return newEntries;
  }

  public async getL1toL2MessagesWithRpc(
    from: number,
    to: number,
  ): Promise<L1toL2MessageType[]> {
    const provider = await this.ethService.getClient();
    const address = this.configService.getOrThrow<string>('ETH_PORTAL_ADDRESS');

    const contract = FuelMessagePortal__factory.connect(address, provider);

    const events = await contract.queryFilter(
      contract.filters.MessageSent,
      from,
      to,
    );

    const messages: L1toL2MessageType[] = events.map((ev) => {
      const { sender, recipient, nonce, amount, data } = ev.args;

      return {
        sender,
        recipient,
        nonce: nonce.toString(),
        amount: amount.toString(),
        data,
      };
    });

    return messages;
  }

  /**
   *
   * @description fetches events, [from, to] inclusive on both on ends
   */
  public async getL1toL2MessagesWithEnvio(
    from: number,
    to: number,
  ): Promise<L1toL2MessageType[]> {
    const address = this.configService.getOrThrow<string>('ETH_PORTAL_ADDRESS');
    const bearerToken = this.configService.getOrThrow<string>('ENVIO_API_KEY');
    const url = this.configService.getOrThrow<string>('ENVIO_URL');

    const client = HypersyncClient.new({
      url,
      bearerToken,
    });

    // The to parameter is exclusive in `presetQueryLogsOfEvent`
    let query = presetQueryLogsOfEvent(
      address,
      MESSAGE_SENT_EVENT_HASH,
      from,
      to + 1, // Make `to` inclusive
    );
    const queryResult = await client.get(query);

    const messages: L1toL2MessageType[] = queryResult.data.logs.map((event) => {
      const log = iface.parseLog({
        data: event.data!,
        topics: event.topics as any,
      }) as LogDescription;

      const [sender, recipient, nonce, amount, data] = log!.args;

      return {
        sender: sender as string,
        recipient: recipient as string,
        nonce: (nonce as bigint).toString(),
        amount: (amount as bigint).toString(),
        data: data as string,
      };
    });

    return messages;
  }

  private envioEnabled() {
    const url = this.configService.get<string>('ENVIO_URL');
    const bearerToken = this.configService.get<string>('ENVIO_API_KEY');

    return !!url && !!bearerToken;
  }

  public async getTokenDeposits() {}

  public async getCommits() {}
}
