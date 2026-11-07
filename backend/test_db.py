from database import engine

try:
    with engine.connect() as connection:
        print("SUCCESS: Python connected to MySQL!")
except Exception as error:
    print("DATABASE CONNECTION FAILED:")
    print(error)