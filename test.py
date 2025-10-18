import sys
import joblib
import pandas as pd

data = pd.DataFrame([(sys.argv[2], sys.argv[1])], columns=["ambience_lux", "seconds_of_day"])

try:
    luminosity_model = joblib.load('model/street_light_model.pkl')
except FileNotFoundError:
    print("Error: Model file 'street_light_model.pkl' not found.")
    exit()
print(luminosity_model.predict(data))
