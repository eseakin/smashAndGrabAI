My friend loved Timon and Pumba's Bug Toss from Sega's The Lion King and asked me to build it. I decided to do it using 100% AI written code just to see how far it could get.

# Goals

- [x] Make a working game using only Cursor's AI Agent
- [x] Don't write a single line of code
- [x] Use AI to write the entire thing
- [x] Use libraries I've never tried before
- [x] Do my best not to look up any documentation

# Outcome

After about 12 hours of work

- The game works great
- Didn't write a single line of code
- Used AI to write the entire thing
- Used Phaser, which I had never heard of
- Never looked up documentation for Phaser

# Working systems

- Win/loss condition
- Parallax scrolling
- Hit points
- Collision
- Player movement + slide/dash + jumping
- Dynamically increasing difficulty
- Dynamic animation framerate control
- Particle effects
- Physics (OOTB gravity)
- Victory screen
- Score keeping
- Complex composite animations with timing offsets
- Interrupting animations when a new command is entered
- Multiple item types with weighted randomization

# Issues

- The beginning was extremely easy, but it quickly became a slog as more features were added
- The AI often rewrites entire sections of unrelated code when changing small things
- The AI often tells you it has changed something when it has deleted and readded the same line
- The AI will confidently tell you it has solved the problem when it has not
- The AI will confidently say "Aha! Now I've figured it out!" when it has not

# Conclusion

- This is an incredible way to springboard a greenfield project, but it's pretty limited for writing the whole thing itself
- Pairing with the AI is far more effective, allowing very fast iteration on modular features
- Telling the AI exactly what you want to build upfront is much more effective than going piecemeal. When I let it know what features I wanted ahead of time, it left space for them, but features developed on the fly often were jammed in with inextensible patterns
