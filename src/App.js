import React, { useEffect, useState, useRef } from 'react';
import { getPokemon, getAllPokemon } from './Services/pokeService'
import './style.scss';

export default function PokeGame() {
  const GAME_WIDTH = 600;
  const GAME_HEIGHT = 150;
  const POKE_WIDTH = 50;
  const POKE_HEIGHT = 50;
  const OBSTACLE_WIDTH = 20;
  const OBSTACLE_HEIGHT = 40;

  const [pokeY, setPokeY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [backgroundImageSize, setBackgroundImageSize] = useState(0);

  const velocityRef = useRef(0);
  const pokeYRef = useRef(0);

  const gravity = 0.5;
  const jumpStrength = 10;

  const obstaclesRef = useRef([]);

  const [hasChosenCharacter, setHasChosenCharacter] = useState(false);

  const [pokemonData, setPokemonData] = useState([])
  const [loading, setLoading] = useState(true);
  const apiURL = 'https://pokeapi.co/api/v2/pokemon?limit=150'

  // Adjust player character background image, depending on size
  const smallPokes = [
    "squirtle", "charmander", "bulbasaur", "jigglypuff", "caterpie", "metapod", "weedle", "kakuna", "pidgey", "rattata", "spearow", "ekans", "pikachu", "sandshrew", "sandslash", "nidoran-f", "nidoran-m", "clefairy", "clefable", "vulpix", "wigglytuff", "zubat", "oddish", "gloom", "paras", "venonat", "diglett", "dugtrio", "meowth", "psyduck", "mankey", "growlithe", "poliwag", "poliwhirl", "abra", "machop", "bellsprout", "geodude", "golem", "ponyta", "slowpoke", "magnemite", "magneton", "farfetchd", "doduo", "seel", "grimer", "shellder", "gastly", "drowzee", "krabby", "voltorb", "electrode", "exeggcute", "cubone", "marowak", "koffing", "chansey", "tangela", "horsea", "seadra", "staryu", "starmie", "mr-mime", "scyther", "magikarp", "ditto", "eevee", "vaporeon", "jolteon", "flareon", "porygon", "omanyte", "omastar", "kabuto", "dratini"
  ];
  const handleChosenCharacter = (url, name) => {
    setHasChosenCharacter(url);
    if (smallPokes.includes(name)) {
      setBackgroundImageSize('185%');
    }
    else {
      setBackgroundImageSize('115%');
    }
  }

  // Handle jump
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.code === 'Space' || e.code === 'ArrowUp') && !isJumping && !gameOver) {
        velocityRef.current = jumpStrength;
        setIsJumping(true);
      }
      if (gameOver && e.code === 'Enter') {
        resetGame();
      }
      if (gameOver && e.code === 'Space') {
        setHasChosenCharacter(false);
        resetGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isJumping, gameOver]);
  // Handle jump for mobile
  const handleMobileJump = () => {
    if (!isJumping && !gameOver) {
      velocityRef.current = jumpStrength;
      setIsJumping(true);
    }

    if (gameOver) {
      setHasChosenCharacter(false);
      resetGame();
    }
  };

  // Get pokemon from api
  useEffect(() => {
    async function fetchData() {
      let response = await getAllPokemon(apiURL)
      await loadPokemon(response.results)
      setLoading(false)
      console.log(response)
    }
    fetchData()
  }, [])
  const loadPokemon = async (data) => {
    let _pokemonData = await Promise.all(data.map(async pokemon => {
      let pokemonGet = await getPokemon(pokemon)
      return pokemonGet
    }))
    setPokemonData(_pokemonData)
  }

  // Update pokeYRef whenever pokeY state changes
  useEffect(() => {
    pokeYRef.current = pokeY;
  }, [pokeY]);

  // Game loop
  useEffect(() => {
    // Stop game running before a character is chosen
    if (!hasChosenCharacter) return;

    let animationFrame;

    const gameLoop = () => {
      // Apply gravity
      velocityRef.current -= gravity;

      setPokeY((prev) => {
        const next = prev + velocityRef.current;

        if (next <= 0) {
          setIsJumping(false);
          velocityRef.current = 0;
          return 0;
        }

        if (next >= GAME_HEIGHT - POKE_HEIGHT) {
          return GAME_HEIGHT - POKE_HEIGHT;
        }

        return next;
      });

      // Detect collision
      detectCollision(pokeYRef.current);

      const moved = obstaclesRef.current
        .map((obs) => ({ ...obs, x: obs.x - 5 }))
        .filter((obs) => obs.x + 20 > 0);

      obstaclesRef.current = moved;
      setObstacles(moved);

      if (!gameOver) {
        setScore((prev) => {
          const newScore = prev + 1;
          setHighScore((high) => Math.max(high, newScore));
          return newScore;
        });
        animationFrame = requestAnimationFrame(gameLoop);
      }
    };

    animationFrame = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrame);
  }, [gameOver, hasChosenCharacter]);

  // Spawn obstacles
  useEffect(() => {
    if (!hasChosenCharacter || gameOver) return;

    const spawnInterval = setInterval(() => {
      const newObstacle = { x: GAME_WIDTH + Math.random() * 100 };
      obstaclesRef.current = [...obstaclesRef.current, newObstacle];
      setObstacles(obstaclesRef.current);
    }, 1500);

    return () => clearInterval(spawnInterval);
  }, [gameOver, hasChosenCharacter]);

  // Collision Detection
  const detectCollision = (currentPokeY) => {
    const poke = {
      x: 50,
      y: currentPokeY,
      width: POKE_WIDTH,
      height: POKE_HEIGHT,
    };

    for (const obs of obstaclesRef.current) {
      const obstacle = {
        x: obs.x,
        y: 0,
        width: OBSTACLE_WIDTH,
        height: OBSTACLE_HEIGHT,
      };

      const pokeTop = poke.y + poke.height;
      const obsTop = obstacle.y + obstacle.height;

      const isHorizontallyAligned =
        poke.x < obstacle.x + obstacle.width &&
        poke.x + poke.width > obstacle.x;

      const isVerticallyAligned =
        poke.y < obsTop && pokeTop > obstacle.y;

      const isColliding = isHorizontallyAligned && isVerticallyAligned;

      console.log(
        `Checking obstacle @ x=${obstacle.x.toFixed(1)}: horiz=${isHorizontallyAligned}, vert=${isVerticallyAligned}, colliding=${isColliding}`
      );

      if (isColliding) {
        console.log('Collision detected!', {
        poke,
        obstacle,
        isHorizontallyAligned,
        isVerticallyAligned,
      });
        setGameOver(true);
        break;
      }
    }
  };

  const resetGame = () => {
    setPokeY(0);
    setIsJumping(false);
    setObstacles([]);
    obstaclesRef.current = [];
    setScore(0);
    velocityRef.current = 0;
    setGameOver(false);
  };

  if (!hasChosenCharacter) {
    return (
      <div className="pageContent">
        <img src="/poke_logo.png" className="main-logo" alt="Pokemon" width={500} />
        <p>This is just a fan project, please don't sue me Nintendo!<br></br>press <strong>space</strong> to jump! (<strong>tap</strong> on mobile)</p>
        <h2>Select Your Character</h2>
        {loading ? (
          <p>Loading Pokémon...</p>
        ) : (
          <div className="characterFlex">
            {pokemonData.slice(0, 150).map((pokemon, index) => (
              <div
                key={index} className="characterBox"
                onClick={() => handleChosenCharacter(`url(${pokemon.sprites.front_default})`, pokemon.name)}
              >
                <img src={pokemon.sprites.front_default} alt={pokemon.name} />
                <p>{pokemon.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    
    <div
      className="gameWindow" onTouchStart={handleMobileJump} style={{
        width: `${GAME_WIDTH}px`,
        height: `${GAME_HEIGHT}px`,
        backgroundImage: 'url(/coast-bg.jpg)',
      }}
    >
      {/* Poke */}
      <div
        className={`playerCharacter${gameOver ? ' playerCharacterGameOver' : ''}`} style={{
          bottom: `${pokeY}px`,
          width: `${POKE_WIDTH}px`,
          height: `${POKE_HEIGHT}px`,
          backgroundImage: `${hasChosenCharacter}`,
          backgroundSize: `${backgroundImageSize}`,
        }}
      />

      {/* Obstacles */}
      {obstacles.map((obs, idx) => (
        <div
          key={idx} className="obstacle"
          style={{
            left: `${obs.x}px`,
            width: `${OBSTACLE_WIDTH}px`,
            height: `${OBSTACLE_HEIGHT}px`,
            backgroundImage: 'url(/tree-sprite.png)',
          }}
        />
      ))}

      {/* Ground */}
      <div className="ground" />

      {/* Score */}
      <div className="score">Score: {score}</div>
      <div className="highScore">High Score: {highScore}</div>

      {/* Game Over */}
      {gameOver && (
        <div className="gameOver">
          <h2>Game Over</h2>
          <p className="gameOverScore">Score: <strong>{score}</strong></p>
          <p className="noMargin">Press <strong>Enter</strong> to restart</p>
          <p className="noMargin">Press <strong>Space</strong> (or <strong>tap</strong>) to change character</p>
        </div>
      )}
    </div>
  );
}