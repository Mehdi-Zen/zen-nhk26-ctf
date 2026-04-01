<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Laboratoire de Rasmus Lerdorf</title>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600&display=swap" rel="stylesheet">
    <style>
        body {
            margin: 0;
            font-family: 'Orbitron', sans-serif;
            background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
            color: #e0f7fa;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }

        .container {
            background: rgba(0, 0, 0, 0.7);
            padding: 60px;
            border-radius: 20px;
            box-shadow: 0 0 40px #00e5ff;
            text-align: center;
            width: 600px;
        }

        h1 {
            margin-bottom: 20px;
            font-size: 32px;
            color: #00e5ff;
        }

        p {
            font-size: 18px;
            opacity: 0.9;
        }

        input[type="file"] {
            margin-top: 30px;
            padding: 15px;
            background: #112;
            border: 2px solid #00e5ff;
            color: white;
            border-radius: 8px;
            font-size: 16px;
            width: 80%;
        }

        button {
            margin-top: 30px;
            padding: 15px 30px;
            border: none;
            background: #00e5ff;
            color: black;
            font-weight: bold;
            border-radius: 8px;
            cursor: pointer;
            font-size: 18px;
            transition: 0.3s;
        }

        button:hover {
            background: #00bcd4;
            box-shadow: 0 0 20px #00e5ff;
        }

        .footer {
            margin-top: 30px;
            font-size: 14px;
            opacity: 0.7;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Laboratoire de Rasmus Lerdorf</h1>
        <p>Centre de téléversement expérimental</p>

        <form action="upload.php" method="POST" enctype="multipart/form-data">
            <input type="file" name="file">
            <br>
            <button type="submit">Uploader</button>
        </form>

        <div class="footer">
            Projet scientifique - Département PHP Research
        </div>
    </div>
</body>
</html>

