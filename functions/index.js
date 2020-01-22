const UUID = require("uuid-v4");
const functions = require('firebase-functions');
const { Storage } = require('@google-cloud/storage');
const projectId = 'computer-store-264522';
const os = require('os');
const path = require('path');
const spawn = require('child-process-promise').spawn;
const cors = require('cors')({ origin: true });
const Busboy = require('busboy');
const fs = require('fs');
const keyFilename = "computer-store-264522-firebase-adminsdk-ov7mz-9e42cfb54f.json";

let gcs = new Storage({
    projectId: projectId,
    keyFilename: keyFilename
});

exports.onFileChange = functions.storage.object().onFinalize(event => {
    const bucket = event.bucket;
    const contentType = event.contentType;
    const filePath = event.name;
    const origMetadata = event.metadata;

    console.log('File change detected. function execution started');

    if (origMetadata.isCompressed) {
        console.log('Already Compressed');
        return;
    }

    const destinationBucket = gcs.bucket(bucket);
    const tempFilePath = path.join(os.tmpdir(), path.basename(filePath));
    const metadata = { contentType: contentType, isCompressed: true };


    return destinationBucket.file(filePath).download({
        destination: tempFilePath
    }).then(() => {
        return spawn('convert', [tempFilePath, '-resize', '500x500', tempFilePath])
    }).then(() => {
        return destinationBucket.upload(tempFilePath, {
            destination: path.basename(filePath),
            metadata: { metadata: metadata }
        });
    })
});

exports.uploadFile = functions.https.onRequest((req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    cors(req, res, () => {

        if (req.method !== 'POST') {
            return res.status(500).json({
                message: 'Not allowed!'
            });
        }

        const busboy = new Busboy({ headers: req.headers });
        let uploadData = null;
        let uuid = UUID();
        const bucketName = 'computer-store-264522.appspot.com';

        busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
            const fileName = new Date().getTime() + filename
            const filepath = path.join(os.tmpdir(), fileName);
            uploadData = { file: filepath, type: mimetype, filename: fileName };
            file.pipe(fs.createWriteStream(filepath));
        });

        busboy.on('finish', () => {
            const bucket = gcs.bucket(bucketName);

            return bucket.upload(uploadData.file, {
                uploadType: 'media',
                metadata: {
                    metadata: {
                        contentType: uploadData.type,
                        firebaseStorageDownloadTokens: uuid
                    }
                }
            }).then(() => {
                return downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(uploadData.filename)}?alt=media&token=${uuid}`
            }).then(downloadUrl => {
                return res.status(200).json({
                    message: 'it worked!',
                    imageUrl: downloadUrl,
                });
            }).catch(err => {
                console.log(err);
                res.status(500).json({
                    error: err
                });
            });
        });

        busboy.end(req.rawBody);
    });
});

exports.uploadBanner = functions.https.onRequest((req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    cors(req, res, () => {

        if (req.method !== 'POST') {
            return res.status(500).json({
                message: 'Not allowed!'
            });
        }

        const busboy = new Busboy({ headers: req.headers });
        let uploadData = null;
        let uuid = UUID();
        const bucketName = 'computer-store-264522.appspot.com';

        busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
            const fileName = new Date().getTime() + filename
            const filepath = path.join(os.tmpdir(), fileName);
            uploadData = { file: filepath, type: mimetype, filename: fileName };
            file.pipe(fs.createWriteStream(filepath));
        });

        busboy.on('finish', () => {
            const bucket = gcs.bucket(bucketName);

            return bucket.upload(uploadData.file, {
                uploadType: 'media',
                metadata: {
                    metadata: {
                        contentType: uploadData.type,
                        firebaseStorageDownloadTokens: uuid,
                        isCompressed: true
                    }
                }
            }).then(() => {
                return downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(uploadData.filename)}?alt=media&token=${uuid}`
            }).then(downloadUrl => {
                return res.status(200).json({
                    message: 'it worked!',
                    imageUrl: downloadUrl,
                });
            }).catch(err => {
                console.log(err);
                res.status(500).json({
                    error: err
                });
            });
        });

        busboy.end(req.rawBody);
    });
});
