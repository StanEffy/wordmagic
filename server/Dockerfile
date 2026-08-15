FROM python:3.12-alpine

WORKDIR /app

COPY server.py .

ENV PORT=8080
ENV WORDMAGIC_DB=/data/wordmagic_server.db
ENV WORDMAGIC_KEY=""

VOLUME ["/data"]

EXPOSE 8080

CMD ["python", "server.py", "--port", "8080"]
