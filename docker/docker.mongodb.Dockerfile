# Use the official MongoDB image as the base image
FROM mongo:6

# Copy the generate-keyfile.sh script to the container
COPY docker/mongodb/generate-keyfile.sh /generate-keyfile.sh

# Create the keyfile directory and generate the keyfile during the image build
RUN mkdir -p /opt/keyfile && \
    /bin/bash /generate-keyfile.sh

# Copy the custom mongod.conf to the container's configuration directory
COPY docker/mongodb/mongod.conf /etc/mongod.conf

# Copy the mongo-init.js file to the container's initialization script directory
COPY docker/mongodb/mongo-init.js /docker-entrypoint-initdb.d/mongo-init.js

CMD ["mongod", "-f", "/etc/mongod.conf"]