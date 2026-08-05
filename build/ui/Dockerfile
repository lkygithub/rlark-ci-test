ARG BASE_IMAGE=nginx:1.29.1
FROM ${BASE_IMAGE}
COPY build/ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY web/dist /usr/share/nginx/html
EXPOSE 80