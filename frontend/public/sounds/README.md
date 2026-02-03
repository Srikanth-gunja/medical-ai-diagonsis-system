# Audio Files for Video Call

This directory contains audio files for the video call ringing feature.

## Required Files

1. **incoming-call.mp3** - Ringing sound played when receiving an incoming video call
2. **outgoing-call.mp3** - Ringing sound played while waiting for the other party to answer

## How to Add Audio Files

1. Find or create appropriate MP3 audio files for incoming and outgoing call sounds
2. Name them `incoming-call.mp3` and `outgoing-call.mp3`
3. Place them in this `/public/sounds/` directory

## Where to Get Audio Files

You can use free sound effects from:
- [Freesound.org](https://freesound.org) - Search for "phone ring" or "incoming call"
- [Zapsplat.com](https://www.zapsplat.com) - Free sound effects library
- [Mixkit.co](https://mixkit.co/free-sound-effects/phone/) - Free phone sounds

## Recommended Audio Specifications

- Format: MP3
- Length: 5-10 seconds (will loop)
- Volume: Medium (0.3-0.5 in the app)
- Sample Rate: 44.1 kHz or 48 kHz

## Note

If audio files are not present, the video call will still work - it just won't play ringing sounds. The UI will show pulsing animations to indicate ringing state.