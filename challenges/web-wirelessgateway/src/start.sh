#!/bin/bash

python3 fake_internal.py &
python3 real_internal.py &
python3 public_app.py

