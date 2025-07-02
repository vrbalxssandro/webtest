/**
 * oneko.js: https://github.com/adryd325/oneko.js
 * 
 * Implements a cute cat that chases the mouse cursor.
 * 
 * This is the 'oneko.js' version, which is a standalone script
 * with no dependencies.
 */
(function oneko() {
  const isReducedMotion =
    window.matchMedia(`(prefers-reduced-motion: reduce)`) === true ||
    window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

  if (isReducedMotion) {
    return;
  }

  const cat = document.createElement("div");
  let catPosition = { x: 0, y: 0 };
  let mousePosition = { x: 0, y: 0 };
  let frame = 0;
  let idleTime = 0;
  let idleAnimation = null;
  let idleAnimationFrame = 0;

  const nekoSpeed = 15;
  const spriteSets = {
    idle: [[-3, -3]],
    alert: [[-7, -3]],
    scratchSelf: [
      [-5, 0],
      [-6, 0],
      [-7, 0],
    ],
    scratchWall: [
      [0, 0],
      [0, -1],
    ],
    sit: [[-2, -3]],
    sleep: [
      [-2, 0],
      [-2, -1],
    ],
    N: [
      [-1, -2],
      [-1, -3],
    ],
    NE: [
      [0, -2],
      [0, -3],
    ],
    E: [
      [-3, -2],
      [-3, -3],
    ],
    SE: [
      [-2, -2],
      [-2, -3],
    ],
    S: [
      [-4, -2],
      [-4, -3],
    ],
    SW: [
      [-5, -2],
      [-5, -3],
    ],
    W: [
      [-6, -2],
      [-6, -3],
    ],
    NW: [
      [-7, -2],
      [-7, -3],
    ],
  };

  function create() {
    cat.id = "oneko";
    cat.style.width = "32px";
    cat.style.height = "32px";
    cat.style.position = "fixed";
    cat.style.backgroundImage = "url('https://cdn.adryd.com/oneko/oneko.gif')";
    cat.style.imageRendering = "pixelated";
    cat.style.left = "16px";
    cat.style.top = "16px";
    cat.style.zIndex = Number.MAX_VALUE;

    document.body.appendChild(cat);

    catPosition.x = 16;
    catPosition.y = 16;

    document.onmousemove = (event) => {
      mousePosition.x = event.clientX;
      mousePosition.y = event.clientY;
    };

    window.requestAnimationFrame(onAnimationFrame);
  }

  function setSprite(name, frame) {
    const sprite = spriteSets[name][frame % spriteSets[name].length];
    cat.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
  }

  function resetIdleAnimation() {
    idleAnimation = null;
    idleAnimationFrame = 0;
  }

  function idle() {
    idleTime += 1;

    if (
      idleTime > 10 &&
      Math.random() < 0.005 &&
      idleAnimation == null
    ) {
      const availableIdleAnimations = ["scratchSelf", "scratchWall"];
      if (catPosition.x < 32) {
        availableIdleAnimations.push("scratchWall");
      }
      idleAnimation =
        availableIdleAnimations[
          Math.floor(Math.random() * availableIdleAnimations.length)
        ];
    }

    switch (idleAnimation) {
      case "scratchSelf":
        idleAnimationFrame += 1;
        if (idleAnimationFrame < 10) {
          setSprite("alert", 0);
          return;
        }
        if (idleAnimationFrame < 25) {
          setSprite("scratchSelf", 0);
          return;
        }
        if (idleAnimationFrame < 40) {
          setSprite("scratchSelf", 1);
          return;
        }
        if (idleAnimationFrame < 55) {
          setSprite("scratchSelf", 2);
          return;
        }
        setSprite("sit", 0);
        if (idleAnimationFrame > 100) {
          resetIdleAnimation();
        }
        break;
      case "scratchWall":
        idleAnimationFrame += 1;
        if (idleAnimationFrame < 10) {
          setSprite("alert", 0);
          return;
        }
        if (idleAnimationFrame < 25) {
          setSprite("scratchWall", 0);
          return;
        }
        if (idleAnimationFrame < 40) {
          setSprite("scratchWall", 1);
          return;
        }
        setSprite("sit", 0);
        if (idleAnimationFrame > 100) {
          resetIdleAnimation();
        }
        break;
      default:
        setSprite("sit", 0);
        if (idleTime > 200) {
          setSprite("sleep", Math.floor(frame / 20));
        }
        break;
    }
  }

  function onAnimationFrame() {
    frame += 1;
    const diffX = catPosition.x - mousePosition.x;
    const diffY = catPosition.y - mousePosition.y;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    if (distance < 30 || distance > 2000) {
      idle();
      window.requestAnimationFrame(onAnimationFrame);
      return;
    }

    idleTime = 0;
    resetIdleAnimation();

    let newCatPosition = { x: catPosition.x, y: catPosition.y };
    if (diffX) {
      newCatPosition.x -= (diffX / distance) * nekoSpeed;
    }
    if (diffY) {
      newCatPosition.y -= (diffY / distance) * nekoSpeed;
    }

    // check if cat can move to new position
    if (
      document
        .elementsFromPoint(newCatPosition.x, newCatPosition.y)
        .filter((e) => e.id !== "oneko").length > 0
    ) {
      catPosition.x = newCatPosition.x;
      catPosition.y = newCatPosition.y;
    }

    cat.style.left = `${catPosition.x - 16}px`;
    cat.style.top = `${catPosition.y - 16}px`;

    const direction =
      diffY > 0
        ? diffX > 0
          ? "NW"
          : "NE"
        : diffX > 0
        ? "SW"
        : "SE";
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        setSprite("W", Math.floor(frame / 5));
      } else {
        setSprite("E", Math.floor(frame / 5));
      }
    } else if (Math.abs(diffY) > Math.abs(diffX)) {
      if (diffY > 0) {
        setSprite("N", Math.floor(frame / 5));
      } else {
        setSprite("S", Math.floor(frame / 5));
      }
    } else {
      setSprite(direction, Math.floor(frame / 5));
    }

    window.requestAnimationFrame(onAnimationFrame);
  }

  create();
})();