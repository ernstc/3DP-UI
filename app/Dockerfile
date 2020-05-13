# build stage
FROM node:lts as build-stage


RUN npm install -g aurelia-cli@^1.2.0


WORKDIR /app

# install dependencies
COPY ./*.json  ./
RUN npm install

COPY config ./config
COPY aurelia_project  ./aurelia_project

COPY types ./types

COPY static ./static

# Copy files in the root folder
COPY *.* ./

# Copy source files
COPY src ./src






# build
FROM build-stage as publish-stage
RUN au build --env prod

# production stage
FROM nginx:alpine as production-stage
COPY nginx.conf /etc/nginx/nginx.conf
WORKDIR /usr/share/nginx/html

COPY --from=publish-stage /app/dist/ .




EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
