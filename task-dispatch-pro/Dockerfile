ARG NODE_VERSION=24.12.0-alpine

FROM node:${NODE_VERSION} AS dev

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./

RUN --mount=type=cache,target=/root/.npm npm install

COPY . .

EXPOSE 6057

CMD ["npm", "run", "dev"]