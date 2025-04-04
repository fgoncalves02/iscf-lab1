from fastapi import FastAPI
from pydantic import BaseModel
import json
import logging
from openweather_api import OpenWeatherAPI
from firebase_api import FirebaseAPI


app = FastAPI()  # app variable will be an "instance" of the class FastAPI
weather_api = OpenWeatherAPI()
firebase_api = FirebaseAPI()

new_data = []

class Sensors(BaseModel):
    x: float 
    y: float 
    z: float 
    timestamp: float
    temperature: float


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/data")
async def getData():
    return new_data
   

@app.post("/data")
async def postData(data: Sensors):
    logging.debug(f"posdata: {data}")
    new_data.append(data)
    firebase_api.save_accelerometer_data(data.dict())
    return {"message": "Data added successfully"}


@app.get("/weather")
def get_weather():
    """Endpoint to get the current weather for a city"""
    return weather_api.get_weather()

@app.get("/forecast")
def get_forecast():
    """Endpoint to get the weather forecast for a city"""
    return weather_api.get_forecast()


if __name__ == "__main__":
    
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)