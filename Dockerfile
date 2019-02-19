# Dockerfile for https://github.com/dbcls/sparql-proxy
#
# Usage example:
#
# $ docker run -e PORT=3000 -e SPARQL_BACKEND=https://integbio.jp/rdf/ddbj/sparql -e ADMIN_USER=admin -e ADMIN_PASSWORD=password -e CACHE_STORE=file -e CACHE_STORE_PATH=/opt/cache -e COMPRESSOR=snappy -e MAX_LIMIT=10000 -e JOB_TIMEOUT=300000 -e MAX_CONCURRENCY=1 -v `pwd`/files:/opt/git/sparql-proxy/files -d -p 80:3000 -t sparql-proxy

FROM node:10.15

WORKDIR /opt/git

RUN useradd -m sparql-proxy
RUN chown sparql-proxy /opt/git
USER sparql-proxy

RUN git clone https://github.com/dbcls/sparql-proxy.git

WORKDIR /opt/git/sparql-proxy

RUN npm install

CMD npm start
