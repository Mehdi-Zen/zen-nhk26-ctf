from scapy.all import *
from qiskit import QuantumCircuit, qpy
import subprocess
import base64
import random
import os

conf.verb = 0

FLAG = "NHK26{quantum_metadata_leak}"
STEGO_PASSWORD = "NHK26{stego_is_fun_but_not_the_flag}"

SRC_IP = "192.168.1.23"
DST_IP = "192.168.1.42"
DNS_IP = "8.8.8.8"

SRC_MAC = "00:11:22:33:44:55"
DST_MAC = "66:77:88:99:aa:bb"
DNS_MAC = "aa:bb:cc:dd:ee:ff"

packets = []

#Génération du bruit réseau
for i in range(200):
    # DNS noise
    qname = random.choice(["example.com","google.com","openai.com"])
    sport = random.randint(20000,60000)
    packets.append(Ether(src=SRC_MAC,dst=DNS_MAC)/IP(src=SRC_IP,dst=DNS_IP)/UDP(sport=sport,dport=53)/DNS(rd=1,qd=DNSQR(qname=qname)))
    packets.append(Ether(src=DNS_MAC,dst=SRC_MAC)/IP(src=DNS_IP,dst=SRC_IP)/UDP(sport=53,dport=sport)/DNS(qr=1,aa=1,qd=DNSQR(qname=qname),an=DNSRR(rrname=qname,ttl=300,rdata="1.2.3.4")))

    # ICMP noise
    dst_ip = f"192.168.1.{random.randint(1,254)}"
    icmp_type = random.choice([0,8])
    packets.append(Ether(src=SRC_MAC,dst=DST_MAC)/IP(src=SRC_IP,dst=dst_ip)/ICMP(type=icmp_type))

    # TCP/UDP noise
    sport = random.randint(20000,60000)
    dport = random.randint(1000,5000)
    flags = random.choice(["S","F","R","PA"])
    packets.append(Ether(src=SRC_MAC,dst=DST_MAC)/IP(src=SRC_IP,dst=DST_IP)/TCP(sport=sport,dport=dport,flags=flags,seq=random.randint(1000,100000)))
    payload = os.urandom(random.randint(20,50))
    packets.append(Ether(src=SRC_MAC,dst=DST_MAC)/IP(src=SRC_IP,dst=DST_IP)/UDP(sport=sport,dport=dport)/payload)

#Génération QPY avec flag dans metadata
qc = QuantumCircuit(1)
qc.metadata = {
    "author": "Bohr",
    "project": "Quantum Leak",
    "note": "nothing interesting here",
    "flag": FLAG
}
with open("quantum_payload.qpy","wb") as f:
    qpy.dump(qc,f)

# Embed QPY dans l'image
subprocess.run([
    "steghide", "embed",
    "-cf","research.jpg",
    "-ef","quantum_payload.qpy",
    "-p", STEGO_PASSWORD,
    "-f"
], stdout=subprocess.DEVNULL)

#Conversation Netcat
sport_nc = 4444
dport_nc = 4444
seq_c = 1000
seq_s = 5000

# Handshake
packets.append(Ether(src=SRC_MAC,dst=DST_MAC)/IP(src=SRC_IP,dst=DST_IP)/TCP(sport=sport_nc,dport=dport_nc,flags="S",seq=seq_c))
packets.append(Ether(src=DST_MAC,dst=SRC_MAC)/IP(src=DST_IP,dst=SRC_IP)/TCP(sport=dport_nc,dport=sport_nc,flags="SA",seq=seq_s,ack=seq_c+1))
packets.append(Ether(src=SRC_MAC,dst=DST_MAC)/IP(src=SRC_IP,dst=DST_IP)/TCP(sport=sport_nc,dport=dport_nc,flags="A",seq=seq_c+1,ack=seq_s+1))

seq_c+=1
seq_s+=1

b64_pass = base64.b64encode(STEGO_PASSWORD.encode()).decode()
conversation = f"""Einstein: Did you embed it?
Bohr: Yes.
Einstein: Same password?
Bohr: Yes.
Bohr: {b64_pass}
Einstein: Good.
"""

for line in conversation.split("\n"):
    data=line+"\n"
    packets.append(Ether(src=SRC_MAC,dst=DST_MAC)/IP(src=SRC_IP,dst=DST_IP)/TCP(sport=sport_nc,dport=dport_nc,flags="PA",seq=seq_c,ack=seq_s)/data.encode())
    seq_c+=len(data)

#HTTP fragmenté (GET + Response)
sport_http = 1234
dport_http = 80
seq_c = 20000
seq_s = 30000

# Handshake
packets.append(Ether(src=SRC_MAC,dst=DST_MAC)/IP(src=SRC_IP,dst=DST_IP)/TCP(sport=sport_http,dport=dport_http,flags="S",seq=seq_c))
packets.append(Ether(src=DST_MAC,dst=SRC_MAC)/IP(src=DST_IP,dst=SRC_IP)/TCP(sport=dport_http,dport=sport_http,flags="SA",seq=seq_s,ack=seq_c+1))
packets.append(Ether(src=SRC_MAC,dst=DST_MAC)/IP(src=SRC_IP,dst=DST_IP)/TCP(sport=sport_http,dport=dport_http,flags="A",seq=seq_c+1,ack=seq_s+1))

seq_c+=1
seq_s+=1

http_get=b"GET /research.jpg HTTP/1.1\r\nHost: lab.local\r\n\r\n"
packets.append(Ether(src=SRC_MAC,dst=DST_MAC)/IP(src=SRC_IP,dst=DST_IP)/TCP(sport=sport_http,dport=dport_http,flags="PA",seq=seq_c,ack=seq_s)/http_get)
seq_c+=len(http_get)

# Response
with open("research.jpg","rb") as f:
    image_data=f.read()
headers=(
    b"HTTP/1.1 200 OK\r\nContent-Type: image/jpeg\r\n" + f"Content-Length: {len(image_data)}\r\n".encode() + b"\r\n"
)
full_response=headers+image_data

CHUNK=1400
for i in range(0,len(full_response),CHUNK):
    chunk=full_response[i:i+CHUNK]
    packets.append(Ether(src=DST_MAC,dst=SRC_MAC)/IP(src=DST_IP,dst=SRC_IP)/TCP(sport=dport_http,dport=sport_http,flags="PA",seq=seq_s,ack=seq_c)/chunk)
    seq_s+=len(chunk)

#Fake TLS Noise
sport_tls=random.randint(40000,50000)
tls_client_hello = bytes.fromhex("16030100dc010000d803035f3759b1c4b5a1")

packets.append(Ether(src=SRC_MAC,dst=DST_MAC)/IP(src=SRC_IP,dst=DST_IP)/TCP(sport=sport_tls,dport=443,flags="S",seq=1111))
packets.append(Ether(src=SRC_MAC,dst=DST_MAC)/IP(src=SRC_IP,dst=DST_IP)/TCP(sport=sport_tls,dport=443,flags="PA",seq=1112,ack=1)/tls_client_hello)

#Write final PCAP
wrpcap("capture.pcap", packets)

print("\nPCAP généré")
print("FLAG:", FLAG)
