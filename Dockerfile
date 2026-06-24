FROM node:22-alpine
WORKDIR /app
COPY package.json server.js reading-checkin.html ./
RUN mkdir -p /app/data
ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000
CMD ["node", "server.js"]
