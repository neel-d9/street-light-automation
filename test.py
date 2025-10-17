import sys
import joblib
import pandas as pd

data = pd.DataFrame([(sys.argv[1], sys.argv[2])], columns=["seconds_of_day", "ambience_lux"])

try:
    luminosity_model = joblib.load('street_light_model.pkl')
except FileNotFoundError:
    print("Error: Model file 'street_light_model.pkl' not found.")
    exit()
print(luminosity_model.predict(data))
