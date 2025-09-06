const { Storage } = require('@google-cloud/storage');

// Creates a client from a service account key file.
const storage = new Storage({
  keyFilename: '../qwiklabs-gcp-01-b1e0c819d981-2d350f570101.json',
  projectId: 'qwiklabs-gcp-01-b1e0c819d981',
});

// The name of the bucket to access.
const bucketName = 'pitch-deck-starter';

exports.generateSignedUrl = async (req, res) => {
  // These options will allow temporary uploading of the file with a PUT request.
  const options = {
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType: req.query.contentType,
  };

  // Get a v4 signed URL for uploading file
  const [url] = await storage
    .bucket(bucketName)
    .file(req.query.fileName)
    .getSignedUrl(options);

  res.set('Access-Control-Allow-Origin', '*');
  res.send({ url });
};
