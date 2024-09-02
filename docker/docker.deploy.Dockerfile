FROM node:20-alpine

RUN apk --no-cache add git curl
RUN npm i -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml /app/

RUN pnpm install

COPY tsconfig.json hardhat.config.ts /app/
COPY scripts/hardhat/ /app/scripts/hardhat/
COPY contracts/mocks/PlaceholderV8.sol /app/contracts/mocks/PlaceholderV8.sol
COPY deploy/ /app/deploy/

RUN pnpm hardhat:compile

COPY contracts/ /app/contracts/

RUN pnpm hardhat:compile


CMD [ "pnpm", "node", "--hostname", "0.0.0.0"]