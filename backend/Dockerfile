FROM python:3.13-slim

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    netcat-openbsd \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./

RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]