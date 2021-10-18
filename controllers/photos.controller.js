const Photo = require('../models/photo.model');
const Voter = require('../models/voter.model');
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if(title && author && email && file) { // if fields are not empty...

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];
      const emailPattern = new RegExp(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'g');
      const testedEmail = emailPattern.test(email)
      const lettersPattern = /^[a-zA-Z]+$/;
      const testedTitle = lettersPattern.test(title);
      if (fileExt === 'jpg' || fileExt === 'gif' || fileExt === 'png' && title.length < 25 && author.length < 50 && testedEmail && testedTitle) {
        const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      }
    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    const clientIp = requestIp.getClientIp(req);
    const voter = await Voter.findOne({user: clientIp});

    if(!photoToUpdate) res.status(404).json({ message: 'Not found' });

    if(!voter) {

      const newVoter = new Voter ({user: clientIp, votes: photoToUpdate._id});
      await newVoter.save();
      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({ message: 'OK' });

    }

      let votedPic = await Voter.findOne({ votes: photoToUpdate._id });

      if(!votedPic){
        voter.votes.push(photoToUpdate._id);
        voter.save();
        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({ message: 'OK' });
  
      } else {
        res.status(500).json({ message: 'Error' })
      }
      
  } catch(err) {
    res.status(500).json(err);
  }
};
