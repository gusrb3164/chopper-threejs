import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

function main() {
  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({ canvas });
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#495057');
  const worldAxis = new THREE.AxesHelper(100);
  const ambientLight = getDefaultLight();
  const chopper = new Chopper();
  const camera = new Camera();
  const terrain = getTerrain();
  // add default objects
  scene.add(ambientLight, chopper.chopper, worldAxis, terrain);
  const [variable, keydownCallback] = createVariableAndKeydownCallback(); // create variable related animation
  document.querySelector('body').onkeydown = keydownCallback; // add keydown function
  const currentBullets = []; // Represent bullet objects in the screen

  // Each frame cycle, execute that animate function of each object.
  function animate() {
    chopper.animate(variable.chopper);
    camera.animate(variable.camera);
    // Check if scene need to add a new bullet.
    if (currentBullets.length < variable.bullets.length) {
      const newBullet = new Bullet(variable.bullets[currentBullets.length]);
      currentBullets.push(newBullet);
      scene.add(newBullet.bullet);
    }
    currentBullets.forEach(bullet => {
      bullet.animate();
    });
    // remove the bullet under the terrain
    if (currentBullets.length > 0 && currentBullets[0].bullet.position.y < 0) {
      scene.remove(scene.getObjectById(currentBullets[0].bullet.id));
      currentBullets.splice(0, 1);
      variable.bullets.splice(0, 1);
    }
    renderer.render(scene, camera.camera);
    requestAnimationFrame(animate);
  }
  return animate;
}

function getTerrain() {
  const geometry = new THREE.PlaneBufferGeometry(1, 1, 256, 256);
  const height = new THREE.TextureLoader().load('./yorkville.jpg');
  const material = new THREE.MeshPhongMaterial({
    color: '#e67700',
    map: height,
    displacementMap: height,
  });
  const terrain = new THREE.Mesh(geometry, material);
  terrain.rotation.x = -Math.PI / 2;
  terrain.scale.set(75, 75, 20);
  return terrain;
}

function getDefaultLight() {
  const ambientLight = new THREE.AmbientLight('white', 0.6);

  return ambientLight;
}

function Camera() {
  this.camera = new THREE.PerspectiveCamera(75, 1, 0.01, 1000);

  this.animate = position => {
    this.camera.position.z =
      position.distance * Math.sin(position.rotateHorizontal) * Math.cos(position.rotateOrthogonal);
    this.camera.position.x =
      position.distance * Math.cos(position.rotateHorizontal) * Math.cos(position.rotateOrthogonal);
    this.camera.position.y = position.distance * Math.sin(position.rotateOrthogonal);
    this.camera.lookAt(0, 0, 0);
  };
}

function Bullet(chopper) {
  const velocity = 0.25;
  const gravity = 0.0003 * 9.8;
  let tick = 0;
  // Calculate gravity acceleration.
  const calcNextHeight = () => {
    tick += 1;
    return gravity * tick;
  };

  const sphereMaterial = new THREE.MeshBasicMaterial({ color: 'wheat' });
  this.bullet = new THREE.Mesh(new THREE.SphereGeometry(0.3, 0.3, 8), sphereMaterial);
  this.bullet.position.set(chopper.x, chopper.y, chopper.z);
  this.bullet.add(new THREE.PointLight('white', 1, 20));
  this.animate = () => {
    this.bullet.position.x -= Math.cos(chopper.rotateY) * velocity;
    this.bullet.position.y -= calcNextHeight();
    this.bullet.position.z += Math.sin(chopper.rotateY) * velocity;
  };
}

function createVariableAndKeydownCallback() {
  const variable = {
    chopper: {
      x: 0,
      y: 30,
      z: 0,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
    },
    camera: {
      distance: 60,
      rotateHorizontal: 0.9,
      rotateOrthogonal: 0.85,
    },
    bullets: [], // Chooper information from the point of shooting.
  };

  function keydownCallback(ev) {
    switch (ev.key) {
      case 'ArrowUp':
        if (ev.getModifierState('Shift')) {
          variable.camera.rotateOrthogonal += 0.01;
        } else {
          variable.chopper.x -= Math.cos(variable.chopper.rotateY);
          variable.chopper.z += Math.sin(variable.chopper.rotateY);
        }
        break;
      case 'ArrowDown':
        if (ev.getModifierState('Shift')) {
          variable.camera.rotateOrthogonal -= 0.01;
        } else {
          variable.chopper.x += Math.cos(variable.chopper.rotateY);
          variable.chopper.z -= Math.sin(variable.chopper.rotateY);
        }
        break;
      case 'ArrowLeft':
        if (ev.getModifierState('Shift')) {
          variable.camera.rotateHorizontal += 0.01;
        } else variable.chopper.rotateY += 0.2;
        break;
      case 'ArrowRight':
        if (ev.getModifierState('Shift')) {
          variable.camera.rotateHorizontal -= 0.01;
        } else variable.chopper.rotateY -= 0.2;
        break;
      case 'a':
      case 'A':
        variable.chopper.y += 0.1;
        break;
      case 'z':
      case 'Z':
        variable.chopper.y -= 0.1;
        break;
      case ' ':
        if (variable.bullets.length < 10) {
          variable.bullets.push({ ...variable.chopper });
        }
        break;
      case '=':
      case '+':
        if (variable.camera.distance > 1) {
          variable.camera.distance -= 1;
        }
        break;
      case '-':
      case '_':
        variable.camera.distance += 1;
        break;
    }

    let keystroke = '';
    if (ev.getModifierState('Shift')) keystroke += 'Shift + ';
    if (ev.key == ' ') keystroke += 'SpaceBar';
    else keystroke += ev.key;
    document.querySelector('#output').innerHTML = keystroke;
  }

  return [variable, keydownCallback];
}

// chopper object
function Chopper() {
  const bodyMaterial = new THREE.MeshPhongMaterial({ color: '#495057' });
  this.chopper = new THREE.Object3D();
  const head = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 1), bodyMaterial);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.5, 0.5), bodyMaterial);

  const roterMaterial = new THREE.MeshPhongMaterial({ color: 'white' });
  const roter = new THREE.Object3D();
  const roterCol = new THREE.Mesh(new THREE.BoxGeometry(5, 0.1, 0.7), roterMaterial);
  const roterRow = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 5), roterMaterial);

  roter.add(roterCol);
  roter.add(roterRow);

  tail.position.x = 1.5;
  roter.position.y = 1;

  head.add(tail);
  head.add(roter);
  this.chopper.add(head);

  this.animate = position => {
    roter.rotation.y += 0.1 - position.rotateY + this.chopper.rotation.y;
    this.chopper.position.set(position.x, position.y, position.z);
    this.chopper.rotation.y = position.rotateY;
  };
}

const animate = main();
requestAnimationFrame(animate);
