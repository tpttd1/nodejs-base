const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());

var fs = require('fs');
const path = require('path');
const thumbsupply = require('thumbsupply');
var multer = require('multer')
const M3U8FileParser = require('m3u8-file-parser');

const port = 4000

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})

const videos = [
    {
        id: 0,
        poster: '/video/0/poster',
        duration: '3 mins',
        name: 'Sample 1',
        code: "1606907234200-0"
    },
    {
        id: 1,
        poster: '/video/1/poster',
        duration: '4 mins',
        name: 'Sample 2',
        code: "1606906409819-1"
    },
    {
        id: 2,
        poster: '/video/2/poster',
        duration: '2 mins',
        name: 'Sample 3',
        code: "1606907229606-2"
    },
    {
        id: 3,
        poster: '/video/2/poster',
        duration: '2 mins',
        name: 'Sample 3',
        code: "1606907224583-3"
    },
];

app.get('/v1/video', (req, res) => {
    res.sendFile('assets/1.mp4', { root: __dirname });
});

app.get('/v1/videos', (req, res) => res.json(videos));

app.get('/v1/video/:id/data', (req, res) => {
    const id = parseInt(req.params.id, 10);
    res.json(videos[id]);
});

app.get('/v1/video/:id', (req, res) => {
    let id = parseInt(req.params.id, 10);
    if (id === 0) {
        var stat = fs.statSync('assets/output/output.m3u8');
        res.writeHead(200, {
            'Content-Type': 'audio/mpeg',
            'Content-Length': stat.size
        });

        var readStream = fs.createReadStream('assets/output/output.m3u8');
        readStream.pipe(res);
    } else {
        const path = `assets/output/${req.params.id}`;
        console.log(path);
        const stat = fs.statSync(path);
        const fileSize = stat.size;
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1]
                ? parseInt(parts[1], 10)
                : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(path, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(200, head);
            fs.createReadStream(path).pipe(res);
        }
    }
});

app.get('/v1/video/:id/poster', (req, res) => {
    thumbsupply.generateThumbnail(`assets/videos/${req.params.id}.mp4`)
        .then(thumb => res.sendFile(thumb));
});

app.get('/v1/video/:id/caption', (req, res) => res.sendFile('assets/captions/sample.vtt', { root: __dirname }));

var upload = multer({ storage: storage }).single('file')

app.post('/v1/upload', function (req, res) {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(500).json(err)
        } else if (err) {
            return res.status(500).json(err)
        }
        return res.status(200).send(req.file)
    })

});

app.listen(4000, () => {
    console.log('Listening on port 4000!')
});