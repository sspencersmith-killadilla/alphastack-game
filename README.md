# AlphaStack

I need to create a game that is a cross between wordle and tetris. So, the player has to guess the random word, but the word isn't a straight row, but is a tetris shape, and then they need to place that word/shape in a field of shapes to eliminate rows like in tetris. They should fall one row every time a wrong guess is made and can only be moved and rotated after the word is correct. It should only allow the player to enter real words. The player should only get 6 guesses, after which the shape falls directly down. when the player makes a full row it should disappear, but the player should only get points for disappearing tiles that were from fully guessed words. if they correctly guess a word in 6 or fewer tries, they can then position the shape and move it side to side so they can place it to fall where they choose. The game should be called AlphaStack

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://alphastack-game.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/73d83754-d504-419b-a31d-027e38d2b2eb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
