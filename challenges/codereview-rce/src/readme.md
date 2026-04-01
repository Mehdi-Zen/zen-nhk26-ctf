```sh
docker build -t grace-hopper-challenge .
docker run -d -p 5000:5000 --name grace-hopper grace-hopper-challenge
```