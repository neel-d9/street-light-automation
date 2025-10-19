import sys
import joblib
import pandas as pd

# Define `data` as a DataFrame with columns `ambience_lux` and `seconds_of_day` containing 50 different values
data = pd.DataFrame({
    "ambience_lux": [float(i) for i in range(50)],
    "seconds_of_day": [int(round(i * (86599 / 49))) for i in range(50)]
})

# Quick verification prints
print(data.head())
print("data shape:", data.shape)

try:
    luminosity_model = joblib.load('models/street_light_model.joblib')
except FileNotFoundError:
    print("Error: Model file 'street_light_model.pkl' not found.")
    exit()
print(luminosity_model.predict(data))
