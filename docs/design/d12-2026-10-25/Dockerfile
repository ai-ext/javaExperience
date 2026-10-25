FROM python:3.12-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        bash coreutils findutils grep sed procps iproute2 curl netcat-openbsd rsync util-linux \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /proof
COPY proof.py /proof/proof.py
ENTRYPOINT ["python3", "/proof/proof.py"]
