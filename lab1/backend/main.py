import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn


app = FastAPI()


@app.get("/items")
def get_items():
    items = [
        {
            "id": 1,
            "name": "BigBoy",
            "img": "https://cdn2.thecatapi.com/images/1su.jpg",
        },
        {
            "id": 2,
            "name": "Swagger",
            "img": "https://cdn2.thecatapi.com/images/3lo.jpg",
        },
        {
            "id": 3,
            "name": "Chiller",
            "img": "https://cdn2.thecatapi.com/images/an5.jpg",
        },
                {
            "id": 4,
            "name": "Viber",
            "img": "https://cdn2.thecatapi.com/images/coa.jpg",
        },
    ]
    random.shuffle(items)
    return items


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # "http://localhost:5173",
        # "http://87.228.16.92"
        "https://valdemir.ru",
        "https://www.valdemir.ru"

    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
