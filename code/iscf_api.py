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


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/data")
async def getData():
    return new_data
   

@app.post("/data")
async def postData(data: Sensors):
    logging.debug(f"posdata: {data}")
    
    temp = weather_api.get_temperature()
    accel_and_temp = data.model_dump()  #Substitui o .dict() do Pydantic v1.  Converte o modelo Pydantic em dict.

    accel_and_temp["temperature"] = temp

    new_data.append(accel_and_temp)
    firebase_api.save_accelerometer_data(accel_and_temp)
    logging.debug(f"accel_and_temp: {accel_and_temp}")
    return {"message": "Data added successfully"}


@app.get("/extraction_freq")
async def get_frequency():
    """Endpoint to get the current extraction_frequency"""
    return firebase_api.get_extraction_freq()

@app.get("/emergency_stop")
async def get_emergency():
    """Endpoint to get the current emergency_stop"""
    return firebase_api.get_emergency_stop()

@app.post("/emergency_stop")
async def get_emergency():
    """Endpoint to post new emergency_stop value"""
    return firebase_api.save_emergency_stop()



@app.get("/temperature")
def get_temperature():
    """Endpoint to get the current temperature for a city"""
    return weather_api.get_temperature()


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
