import sys
import joblib
import pandas as pd

# Define `data` as a DataFrame with a single column `ambience_lux` containing 50 different values
data = pd.DataFrame({
    "ambience_lux": [float(i) for i in range(50)]
})

# Quick verification prints
print(data.head())
print("data shape:", data.shape)

try:
    luminosity_model = joblib.load('model/street_light_model_no_timestamp.pkl')
except FileNotFoundError:
    print("Error: Model file 'street_light_model.pkl' not found.")
    exit()
print(luminosity_model.predict(data))
