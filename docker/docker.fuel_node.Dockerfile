FROM ghcr.io/fuellabs/fuel-core:v0.33.0

RUN apt update
RUN apt install jq -y

COPY ./docker/fuel_node/fuel_node.sh .

CMD [ "./fuel_node.sh" ]