import sys
import joblib
import pandas as pd

# Define DataFrame with columns `ambience_lux` and `seconds_of_day`
data_multi = pd.DataFrame({
    "ambience_lux": [float(i) for i in range(50)],
    "seconds_of_day": [int(round(i * (86399 / 49))) for i in range(50)]
})
data_single = pd.DataFrame(
    [(10, 2000)],
    columns=["ambience_lux", "seconds_of_day"]
)

try:
    luminosity_model = joblib.load('models/street_light_model.joblib')
except FileNotFoundError:
    print("Error: Model file 'street_light_model.pkl' not found.")
    exit()
    
print(data_multi.head())
print("data shape:", data_multi.shape)
print(luminosity_model.predict(data_multi))

print(data_single.head())
print("data shape:", data_single.shape)
print(luminosity_model.predict(data_single))
