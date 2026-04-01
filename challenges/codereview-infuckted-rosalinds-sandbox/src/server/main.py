import asyncio
import json
import copy
import random
import time
import re
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from pydantic_core import PydanticUndefined as MISSING
from typing import Annotated, Any, Literal, Optional
from pydantic import BaseModel, Field, WrapValidator, ValidationError

from server.database import COUNTRIES_DATA
from server.secrets import RRR, TTT

app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent.parent
CLIENT_STATIC_DIR = BASE_DIR / "client"
app.mount("/static", StaticFiles(directory=str(CLIENT_STATIC_DIR)), name="static")

class Country:
    def __init__(self, key, data):
        self.id = key
        self.name = data["name"]
        self.population = data["pop"]
        self.infected = data["inf"]
        self.cured = 0

    def __getattr__(self, name):
        if name.startswith("sequence_antigen_"):
            return True
        raise AttributeError(f"'{type(self).__name__}' object has no attribute '{name}'")

    def __setattr__(self, name, value):
        if name.startswith("sequence_antigen_"):
            try:
                catalyst_id = int(name.split("_")[-1])
                if catalyst_id != abs(game_state["research_points"]):
                    return
                asyncio.create_task(self._fold_protein_structure(value, catalyst_id))
            except ValueError:
                pass
        else:
            super().__setattr__(name, value)

    async def _fold_protein_structure(self, rna_chain, catalyst_id):
        game_state["sequencing_active"] = True
        
        base_pairs = "".join(chr(ord(c) ^ (abs(catalyst_id) % 256)) for c in rna_chain)
        
        if re.search(r'([+\-<>\*])\1{11,}', base_pairs):
            return 
        
        if len(base_pairs) > 500:
            return
        
        country_keys = list(game_state["countries"].keys())
        ptr = country_keys.index(self.id)

        folding_map = {}
        codon_stack = []
        for i, nucleo in enumerate(base_pairs):
            if nucleo == '[': codon_stack.append(i)
            elif nucleo == ']':
                if codon_stack:
                    start = codon_stack.pop()
                    folding_map[start] = i
                    folding_map[i] = start

        idx = 0
        cycles = 0
        peptide_chain = "" 
        
        while idx < len(base_pairs):
            cycles += 1
            if cycles > 5000000: break
            
            enzyme = base_pairs[idx]
            target_country = game_state["countries"][country_keys[ptr]]

            if enzyme == '>':
                ptr = (ptr + 1) % len(country_keys)
            elif enzyme == '<':
                ptr = (ptr - 1) % len(country_keys)
            elif enzyme == '+':
                target_country.cured += 1
            elif enzyme == '-':
                target_country.cured -= 1
            elif enzyme == '*':
                target_country.cured = target_country.population
                target_country.infected = 0
            elif enzyme == '.':
                marker = (target_country.cured ^ target_country.population) % 256
                peptide_chain += chr(marker)
                if "ERADICATION" in peptide_chain:
                    game_state["absolute_antidote_synthesized"] = True
            elif enzyme == '[':
                if target_country.cured == 0: idx = folding_map.get(idx, idx)
            elif enzyme == ']':
                if target_country.cured != 0: idx = folding_map.get(idx, idx)

            idx += 1
            if cycles % 5000 == 0: await asyncio.sleep(0)

def initialize_game():
    state = {
        "game_active": False,
        "phase": "waiting",
        "research_points": 0,
        "vaccine_power": 100000,
        "countries": {},
        "anomalies": [],
        "absolute_antidote_synthesized": False,
        "sequencing_active": False
    }
    for key, data in COUNTRIES_DATA.items():
        state["countries"][key] = Country(key, data)
    return state

game_state = initialize_game()

def serialize_game_state():
    safe_state = copy.copy(game_state)
    safe_state["countries"] = {k: v.__dict__ for k, v in game_state["countries"].items()}
    return safe_state

class WebSocketManager:
    def __init__(self):
        self.active_connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        if len(self.active_connections) >= 5:
            await websocket.close(code=1013)
            return False
        await websocket.accept()
        self.active_connections.add(websocket)
        return True

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: str):
        if not self.active_connections: return
        async def transmit(connection):
            try:
                await asyncio.wait_for(connection.send_text(message), timeout=0.5)
            except Exception:
                self.disconnect(connection)
        tasks = [transmit(conn) for conn in self.active_connections]
        await asyncio.gather(*tasks, return_exceptions=True)

manager = WebSocketManager()

async def game_loop():
    global game_state
    while True:
        if game_state.get("game_active"):
            exposed_countries = []
            compromised_countries = []
            
            for key, data in game_state["countries"].items():
                clean_count = data.population - data.infected - data.cured
                if data.infected > 0:
                    compromised_countries.append(key)
                    if clean_count > 0:
                        spread = min(max(int(data.infected * 0.07), 1), clean_count)
                        data.infected += spread
                elif clean_count > 0:
                    exposed_countries.append(key)

            for inc_c in compromised_countries:
                if exposed_countries and random.random() < 0.02:
                    target = random.choice(exposed_countries)
                    c_data = game_state["countries"][target]
                    clean_count = c_data.population - c_data.infected - c_data.cured
                    c_data.infected += min(10, clean_count)
                    exposed_countries.remove(target)

            current_time = time.time()
            pending_anomalies = []
            for a in game_state["anomalies"]:
                if a["expires"] > current_time:
                    pending_anomalies.append(a)
                else:
                    target = a["target"]
                    country = game_state["countries"][target]
                    clean_count = country.population - country.infected - country.cured
                    if clean_count > 0:
                        decay = max(5000, int(country.infected * 0.15))
                        country.infected += min(decay, clean_count)
            
            game_state["anomalies"] = pending_anomalies

            if random.random() < 0.06:
                target = random.choice(list(COUNTRIES_DATA.keys()))
                game_state["anomalies"].append({
                    "id": f"evt_{int(current_time*1000)}",
                    "type": "alerte_critique",
                    "target": target,
                    "expires": current_time + 5.0,
                    "yield_value": random.randint(2, 5) 
                })

            total_pop = sum(c.population for c in game_state["countries"].values())
            total_inf = sum(c.infected for c in game_state["countries"].values())
            total_clean = sum((c.population - c.infected - c.cured) for c in game_state["countries"].values())
            total_cured = sum(c.cured for c in game_state["countries"].values())

            if total_inf >= (total_pop * 0.50):
                game_state["game_active"] = False
                game_state["phase"] = "game_over"
                
            elif (total_cured == total_pop) and (total_inf == 0) and (total_clean == 0) and (total_pop > 0):
                game_state["game_active"] = False
                game_state["phase"] = "victory"
                
                if game_state.get("absolute_antidote_synthesized"):
                    game_state["flag"] = RRR
                elif game_state.get("sequencing_active"):
                    game_state["flag"] = TTT
                else:
                    game_state["flag"] = "NHK26{NOOb_3nd1ng}"

        await manager.broadcast(json.dumps(serialize_game_state()))
        await asyncio.sleep(1.0)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(game_loop())

@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    return FileResponse("client/error.html", status_code=exc.status_code)

# --- ROUTES DES PAGES DU FORUM ---

@app.get("/")
async def root():
    return FileResponse("client/index.html")

@app.get("/thread/Global_Contagion")
async def view_thread_main():
    return FileResponse("client/thread/thread_Global_Contagion.html")

@app.get("/leaks")
async def view_leaks():
    return FileResponse("client/leaks.html")

@app.get("/tools")
async def view_tools():
    return FileResponse("client/tools.html")

@app.get("/pgp")
async def view_pgp():
    return FileResponse("client/pgp.html")

@app.get("/rules")
async def view_rules():
    return FileResponse("client/rules.html")

@app.get("/thread/cisco")
async def view_thread_cisco():
    return FileResponse("client/thread/thread_cisco.html")

@app.get("/thread/reverse")
async def view_thread_reverse():
    return FileResponse("client/thread/thread_reverse.html")

@app.get("/error")
async def view_error():
    return FileResponse("client/error.html")

# --- ROUTES DU JEU ET DES ASSETS ---

@app.get("/global_contagion")
async def game(): 
    return FileResponse("client/global_contagion.html")

@app.get("/downloads/global_contagion.zip")
async def download_game():
    file_path = "client/downloads/global_contagion.zip"
    return FileResponse(
        path=file_path, 
        media_type="application/zip", 
        filename="global_contagion.zip"
    )

def process_legacy_tsv_streams(v: Any, handler):
    if type(v) is str and len(v.split('\t')) > 1:
        return v 
    return handler(v)

class ClientAction(BaseModel):
    type: Literal["init_game", "reset_game", "resolve_anomaly", "buy_upgrade", "deploy_vaccine"]
    id: Optional[str] = None
    upgrade_id: Optional[str] = None
    target: Optional[str] = None
    payload: Annotated[Optional[str], WrapValidator(process_legacy_tsv_streams)] = Field(default=None, max_length=50)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global game_state
    if not await manager.connect(websocket): return
        
    try:
        while True:
            data = await websocket.receive_text()
            try:
                parsed_data = json.loads(data)
                if not isinstance(parsed_data, dict): continue
                action = ClientAction(**parsed_data)
            except (json.JSONDecodeError, ValidationError):
                continue

            if action.type == "init_game": 
                game_state["game_active"] = True
                game_state["phase"] = "playing"
                
            elif action.type == "reset_game": 
                game_state = initialize_game()
                game_state["game_active"] = True
                game_state["phase"] = "playing"
                
            elif action.type == "resolve_anomaly":
                a_id = action.id
                for a in game_state["anomalies"]:
                    if a["id"] == a_id:
                        target = a["target"]
                        country = game_state["countries"][target]
                        healed = min(2000, country.infected)
                        country.cured += healed
                        country.infected -= healed
                        game_state["research_points"] += a.get("yield_value", 1)
                        game_state["anomalies"].remove(a)
                        break

            elif action.type == "buy_upgrade":
                u_id = action.upgrade_id
                cost = 25 if u_id == "lvl2" else 100 if u_id == "lvl3" else 0
                power = 500000 if u_id == "lvl2" else 2000000 if u_id == "lvl3" else 0
                
                if cost > 0 and game_state["research_points"] >= cost and game_state["vaccine_power"] < power:
                    await asyncio.sleep(0.1)
                    game_state["research_points"] -= cost
                    game_state["vaccine_power"] = power

            elif action.type == "deploy_vaccine":
                target = action.target
                payload = action.payload or ""
                
                if target and target in game_state["countries"]:
                    country_obj = game_state["countries"][target]
                    
                    if payload != "PAYS":
                        try:
                            vaccine_genes = json.loads(payload)
                            
                            if game_state["research_points"] < 0:
                                for gene_key, gene_value in vaccine_genes.items():
                                    if gene_key.startswith("sequenceantigen") and hasattr(country_obj, gene_key):
                                        setattr(country_obj, gene_key, gene_value)
                                        
                        except json.JSONDecodeError:
                            if game_state["research_points"] >= 10:
                                game_state["research_points"] -= 10
                                power = game_state["vaccine_power"]
                                healed = min(power, country_obj.infected)
                                country_obj.cured += healed
                                country_obj.infected -= healed
                    #else:
                        #country_obj.cured = country_obj.population
                        #country_obj.infected = 0
                                
                #elif payload == "MONDE":
                    #for c in game_state["countries"].values():
                        #c.cured = c.population
                        #c.infected = 0
                #elif payload == "10PR":
                    #game_state["research_points"] += 10
                            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
