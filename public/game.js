class Game{
	constructor(){
		if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
		
		this.container;
		this.player = { };
        this.animations = {};
		this.stats;
		this.camera;
		this.scene;
		this.renderer;
		this.container = document.createElement( 'div' );
		this.container.style.height = '100%';
		document.body.appendChild( this.container );
        this.sprayButtonPressed = false;
		const game = this;
		this.anims = ['Walking', 'Walking Backwards', 'Turn', 'Running', 'Pointing Gesture', 'Pointing'];
        
		this.assetsPath = './assets/';
		
		this.clock = new THREE.Clock();
        
        this.init();

		window.onError = function(error){
			console.error(JSON.stringify(error));
		}
	}

	init() {

		this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 5000 );
		this.camera.position.set(112, 100, 600);
        
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color( 0xa0a0a0 );
		this.scene.fog = new THREE.Fog( 0xa0a0a0, 1000, 5000 );

		let light = new THREE.HemisphereLight( 0xffffff, 0x444444 );
		light.position.set( 0, 200, 0 );
		this.scene.add( light );

        const shadowSize = 200;
		light = new THREE.DirectionalLight( 0xffffff );
		light.position.set( 0, 200, 100 );
		light.castShadow = true;
		light.shadow.camera.top = shadowSize;
		light.shadow.camera.bottom = -shadowSize;
		light.shadow.camera.left = -shadowSize;
		light.shadow.camera.right = shadowSize;
		this.scene.add( light );
        this.sun = light;

		// ground
		var mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 10000, 10000 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
		mesh.rotation.x = - Math.PI / 2;
		mesh.receiveShadow = true;
		this.scene.add( mesh );

		var grid = new THREE.GridHelper( 5000, 40, 0x000000, 0x000000 );
		grid.material.opacity = 0.2;
		grid.material.transparent = true;
		this.scene.add( grid );

		this.loader = new THREE.FBXLoader();

		try {
			//load Player Rig
			this.loader.load( `${this.assetsPath}rigs/people/Streetman.fbx`, (streetManObject) => {
				this.loader.load( `${this.assetsPath}rigs/can/sprayCan.fbx`, (sprayCanObject) => {
	
				streetManObject.mixer = new THREE.AnimationMixer( streetManObject );
				this.player.mixer = streetManObject.mixer;
				this.player.root = streetManObject.mixer.getRoot();
				this.player.inFlightSprayMarkings = new Array();
				this.player.landedSprayMarkings = new Array();
				this.player.nozzelCoeff = 5;
				this.player.particleSpeed = 80;
				this.player.sprayColourSelected = "#ff00ff";
				streetManObject.name = "StreetMan";
	
				streetManObject.traverse( function ( child ) {
					if ( child.isMesh ) {
						child.castShadow = true;
						child.receiveShadow = false;		
					}
				} );
				
				const tLoader = new THREE.TextureLoader();
				tLoader.load(`${this.assetsPath}images/SimplePeople_StreetMan_White.png`, function(texture){
					streetManObject.traverse( function ( child ) {
						if ( child.isMesh ){
							child.material.map = texture;
						}
					} );
				});
				
				this.player.object = new THREE.Object3D();
				this.scene.add(this.player.object);
				this.player.object.add(streetManObject);
				this.animations.Idle = streetManObject.animations[0];
				this.loadNextAnim();
				
				
				//Spraycan
				sprayCanObject.name = "SprayCan";
				
				sprayCanObject.traverse( function ( child ) {
					if ( child.isMesh ) {
						child.castShadow = true;
						child.receiveShadow = false;		
					}
				} );
				
				tLoader.load(`${this.assetsPath}images/GraffitiLable.png`, (texture) => {
					console.log("SprayCan Texture loaded.");
					sprayCanObject.traverse(( child ) => {
						if ( child.isMesh ){
							child.material.map = texture;
						}
					} );
				});
				
				this.player.sprayCan = new THREE.Object3D();
				this.player.sprayCan = sprayCanObject;
				this.player.sprayCan.scale.set(0.15,0.15,0.15);
			});
		} );
		
		} catch (error) {
			console.error(error);
		}

		this.renderer = new THREE.WebGLRenderer( { antialias: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.shadowMap.enabled = true;
		this.container.appendChild( this.renderer.domElement );

		this.nippleContainer = document.createElement('div');
		this.nippleContainer.id = 'nippleButton'
		this.nippleContainer.style.z = '0';
		// this.nippleContainer.style.display = 'none';
		this.nippleContainer.style.position = 'absolute';
		this.nippleContainer.style.left = '20px';
		this.nippleContainer.style.bottom = '40px';
		this.nippleContainer.style.minWidth = '150px';
		this.nippleContainer.style.minHeight = '150px';
		this.nippleContainer.style.borderRadius = '50%';
		this.nippleContainer.style.outline = 'none';
		this.nippleContainer.style.border = 'medium solid rgb(68, 68, 68)';
		this.nippleContainer.style.background = 'rgba(126, 126, 126, 0.5)';


		this.grafModeIconContainer = document.createElement('button');
		this.grafModeIconContainer.id = 'grafButton'
		this.grafModeIconContainer.style.z = '0';
		this.grafModeIconContainer.style.position = 'absolute';
		this.grafModeIconContainer.style.left = '20px';
		this.grafModeIconContainer.style.top = '40px';
		this.grafModeIconContainer.style.minWidth = '100px';
		this.grafModeIconContainer.style.minHeight = '100px';
		this.grafModeIconContainer.style.borderRadius = '50%';
		this.grafModeIconContainer.style.outline = 'none';
		this.grafModeIconContainer.style.border = 'medium solid rgb(68, 68, 68)';
		this.grafModeIconContainer.style.background = 'rgba(126, 126, 126, 0.5)';
		this.grafModeIconContainer.style.userDrag = 'none';
		this.grafModeIconContainer.style.userSelect = 'none';


		this.sprayActionIconContainer = document.createElement('button');
		this.sprayActionIconContainer.id = 'sprayButton'
		this.sprayActionIconContainer.style.z = '0';
		this.sprayActionIconContainer.style.position = 'absolute';
		this.sprayActionIconContainer.style.right = '20px';
		this.sprayActionIconContainer.style.bottom = '45px';
		this.sprayActionIconContainer.style.minWidth = '100px';
		this.sprayActionIconContainer.style.minHeight = '100px';
		this.sprayActionIconContainer.style.borderRadius = '50%';
		this.sprayActionIconContainer.style.outline = 'none';
		this.sprayActionIconContainer.style.border = 'medium solid rgb(68, 68, 68)';
		this.sprayActionIconContainer.style.background = 'rgba(126, 126, 126, 0.5)';
		this.sprayActionIconContainer.style.userDrag = 'none';
		this.sprayActionIconContainer.style.userSelect = 'none';

		this.sprayIcon = document.createElement('img');
		this.sprayIcon.style.width = "50px";
		this.sprayIcon.style.height = "50px";
		this.sprayIcon.style.filter = 'invert(100%)';
		this.sprayIcon.style.userSelect = 'none';
		this.sprayIcon.src = './assets/icons/spray.svg';
		this.sprayIcon.style.userDrag = 'none';
		this.sprayIcon.style.userSelect = 'none';
		this.sprayIcon.draggable = false;

		this.colorPickerIconContainer = document.createElement('button');
		this.colorPickerIconContainer.id = 'colorPickerButton'
		this.colorPickerIconContainer.style.z = '0';
		this.colorPickerIconContainer.style.position = 'absolute';
		this.colorPickerIconContainer.style.right = '40px';
		this.colorPickerIconContainer.style.top = '60px';
		this.colorPickerIconContainer.style.minWidth = '50px';
		this.colorPickerIconContainer.style.minHeight = '50px';
		this.colorPickerIconContainer.style.borderRadius = '10%';
		this.colorPickerIconContainer.style.outline = 'none';
		this.colorPickerIconContainer.style.border = 'medium solid rgb(68, 68, 68)';
		this.colorPickerIconContainer.style.background = 'rgba(126, 126, 126, 0.5)';
		this.colorPickerIconContainer.style.userDrag = 'none';
		this.colorPickerIconContainer.style.userSelect = 'none';

		this.colorPickerIcon = document.createElement('img');
		this.colorPickerIcon.id = "colorPickerIcon";		
		this.colorPickerIcon.style.width = "50px";
		this.colorPickerIcon.style.height = "50px";
		this.colorPickerIcon.style.filter = 'invert(100%)';
		this.colorPickerIcon.style.userSelect = 'none';
		this.colorPickerIcon.style.userDrag = 'none';
		this.colorPickerIcon.style.userSelect = 'none';
		this.colorPickerIcon.draggable = false;

		this.graffitiIcon = document.createElement('img');
		this.graffitiIcon.style.width = "50px";
		this.graffitiIcon.style.height = "50px";
		this.graffitiIcon.style.filter = 'invert(100%)';
		this.graffitiIcon.style.userSelect = 'none';
		this.graffitiIcon.src = './assets/icons/spray.svg';
		this.graffitiIcon.style.userDrag = 'none';
		this.graffitiIcon.style.userSelect = 'none';
		this.graffitiIcon.draggable = false;

		this.runIcon = document.createElement('img');
		this.runIcon.style.width = "50px";
		this.runIcon.style.height = "50px";
		this.runIcon.style.filter = 'invert(100%)';
		this.runIcon.style.userSelect = 'none';
		this.runIcon.src = './assets/icons/run.svg';
		this.runIcon.style.userDrag = 'none';
		this.runIcon.style.userSelect = 'none';
		this.runIcon.draggable = false;

		document.body.appendChild(this.nippleContainer);
		document.body.appendChild(this.grafModeIconContainer);
		document.body.appendChild(this.sprayActionIconContainer);
		document.body.appendChild(this.colorPickerIconContainer);
		this.grafModeIconContainer.appendChild(this.graffitiIcon);
		this.grafModeIconContainer.appendChild(this.runIcon);
		this.sprayActionIconContainer.appendChild(this.sprayIcon);

		this.graffitiIcon.style.display = 'inline';
		this.runIcon.style.display = 'none';
		this.colorPickerIconContainer.style.visibility = 'hidden';
		this.colorPickerIcon.style.visibility = 'hidden';
		this.sprayActionIconContainer.style.visibility = 'hidden';

		this.colorPickerIconContainer.appendChild(this.colorPickerIcon);
		
		//init color picker
		this.pickr = Pickr.create({
			el: this.colorPickerIcon,
			default: "#ff00ff",
			defaultRepresentation: 'HEX',
			theme: 'nano', // or 'monolith', or 'nano'
			comparison: false,
			components: {

				// Main components
				preview: true,
				opacity: false,
				hue: true,

				// Input / output Options
				interaction: {
					hex: false,
					rgba: false,
					hsla: false,
					hsva: false,
					cmyk: false,
					input: false,
					clear: false,
					save: false
				}
			}
		});

		//switching between spray mode and run mode
		this.grafModeIconContainer.addEventListener("click", () => {
			this.changePerspective();
			this.changeButtonIcon();
			if (this.player.spraying) {
				this.sprayActionIconContainer.style.visibility = 'visible';
				this.sprayIcon.style.visibility = 'visible';
				this.colorPickerIconContainer.style.visibility = 'visible';
				this.colorPickerIcon.style.visibility = 'visible';

			} else {
				this.sprayActionIconContainer.style.visibility = 'hidden';
				this.sprayIcon.style.visibility = 'hidden';
				this.colorPickerIconContainer.style.visibility = 'hidden';
				this.colorPickerIcon.style.visibility = 'hidden';

			}
		}, false);
		this.sprayActionIconContainer.addEventListener("click", () => {
			this.spray();
		}, false);
		this.sprayActionIconContainer.addEventListener("mousedown", () => {
			this.sprayTimer = setInterval(() => {
				this.spray();
			}, 20);
		}, false);
		this.sprayActionIconContainer.addEventListener("touchstart", () => {
			this.sprayTimer = setInterval(() => {
				this.spray();
			}, 20);
		}, false);
		this.sprayActionIconContainer.addEventListener("mouseup", () => {
			clearInterval(this.sprayTimer);
		}, false);
		this.sprayActionIconContainer.addEventListener("mouseout", () => {
			clearInterval(this.sprayTimer);
		}, false);
		this.sprayActionIconContainer.addEventListener("mouseleave", () => {
			clearInterval(this.sprayTimer);
		}, false);
		this.sprayActionIconContainer.addEventListener("touchcancel", () => {
			clearInterval(this.sprayTimer);
		}, false);
		this.sprayActionIconContainer.addEventListener("touchend", () => {
			clearInterval(this.sprayTimer);
		}, false);
		this.pickr.on('change', instance => {
			this.player.sprayColourSelected = this.pickr.getColor().toHEXA().toString();
		});


		window.addEventListener( 'resize', function(){ this.onWindowResize(); }, false );
	}
	
	
    loadNextAnim(){
		let anim = this.anims.pop();
		this.loader.load( `${this.assetsPath}anims/${anim}.fbx`, ( object ) => {
			this.animations[anim] = object.animations[0];
			if (this.anims.length>0){
				this.loadNextAnim();
			}else{
				this.createCameras();
				this.createColliders();
				this.joystick = nipplejs.create({
					zone: this.nippleContainer,
					mode: 'static',
					position: {left: '50%', top: '50%'},
					dynamicPage: true,
					size: 100,
				});
				this.joystick.on('move', (moveData) => {
					this.playerControl(-moveData.target.nipples[0].frontPosition.y / 50, moveData.target.nipples[0].frontPosition.x / 50);
				});
				this.joystick.on('end', (moveData) => {
					this.playerControl(0, 0);
				});
				

				delete this.anims;
				this.action = "Idle";
				this.animate();
			}
		});	
	}

	changeButtonIcon() {
		if (this.runIcon.style.display == 'none') {
			this.graffitiIcon.style.display = 'none';
			this.runIcon.style.display = 'inline';

		} else {
			this.graffitiIcon.style.display = 'inline';
			this.runIcon.style.display = 'none';
		}
	}

	changePerspective() {
		if ( this.player.cameras!=undefined && this.player.cameras.active!=undefined) {
			if (this.player.cameras.active == this.player.cameras.fps) {
				console.log("Perspective changed to third-person.");
				this.player.spraying = false;
				this.action = 'Idle';
				this.player.cameras.active = this.player.cameras.back;
			} else if (this.player.cameras.active == this.player.cameras.back) {
				console.log("Perspective changed to first-person.");
				this.player.spraying = true;
				this.action = 'Pointing';
				this.delayActionPause();

				this.player.cameras.active = this.player.cameras.fps;
				this.player.cameras.active.updateMatrix();
				this.player.cameras.active.matrixAutoUpdate = false;

			}
		}
	}
    
    createColliders(){
        const geometry = new THREE.BoxGeometry(500, 400, 500);
        const material = new THREE.MeshBasicMaterial({color:0x222222, wireframe:true});
        
        this.colliders = [];
        
        for (let x=-5000; x<5000; x+=1000){
            for (let z=-5000; z<5000; z+=1000){
                if (x==0 && z==0) continue;
                const box = new THREE.Mesh(geometry, material);
                box.position.set(x, 250, z);
                this.scene.add(box);
                this.colliders.push(box);
            }
        }
        
        const geometry2 = new THREE.BoxGeometry(1000, 40, 1000);
        const stage = new THREE.Mesh(geometry2, material);
        stage.position.set(0, 20, 0);
        this.colliders.push(stage);
        this.scene.add(stage);
	}

    
    movePlayer(dt){
		const pos = this.player.object.position.clone();
		pos.y += 60;
		let dir = new THREE.Vector3();
		this.player.object.getWorldDirection(dir);
		if (this.player.move.forward<0) {
			dir.negate();
		}
		let raycaster = new THREE.Raycaster(pos, dir);
		let blocked = false;
		const colliders = this.colliders;
	
		if (colliders!==undefined){ 
			const intersect = raycaster.intersectObjects(colliders);
			if (intersect.length > 0){
				if (intersect[0].distance < 50) blocked = true;
			}
		}
		
		if (!blocked){
			if(!this.player.spraying) {
				if (this.player.move.forward>0){
					const speed = (this.player.action=='Running') ? 400 : 150;
					this.player.object.translateZ(dt*speed);
				}else{
					this.player.object.translateZ(-dt*30);
				}
			}
		}
		
		if (colliders!==undefined){
			//cast left
			dir.set(-1,0,0);
			dir.applyMatrix4(this.player.object.matrix);
			dir.normalize();
			raycaster = new THREE.Raycaster(pos, dir);

			let intersect = raycaster.intersectObjects(colliders);
			if (intersect.length>0){
				if (intersect[0].distance<50) this.player.object.translateX(100-intersect[0].distance);
			}
			
			//cast right
			dir.set(1,0,0);
			dir.applyMatrix4(this.player.object.matrix);
			dir.normalize();
			raycaster = new THREE.Raycaster(pos, dir);

			intersect = raycaster.intersectObjects(colliders);
			if (intersect.length>0){
				if (intersect[0].distance<50) this.player.object.translateX(intersect[0].distance-100);
			}
			
			//cast down
			dir.set(0,-1,0);
			pos.y += 200;
			raycaster = new THREE.Raycaster(pos, dir);
			const gravity = 30;

			intersect = raycaster.intersectObjects(colliders);
			if (intersect.length>0){
				const targetY = pos.y - intersect[0].distance;
				if (targetY > this.player.object.position.y){
					//Going up
					this.player.object.position.y = 0.8 * this.player.object.position.y + 0.2 * targetY;
					this.player.velocityY = 0;
				}else if (targetY < this.player.object.position.y){
					//Falling
					if (this.player.velocityY==undefined) this.player.velocityY = 0;
					this.player.velocityY += dt * gravity;
					this.player.object.position.y -= this.player.velocityY;
					if (this.player.object.position.y < targetY){
						this.player.velocityY = 0;
						this.player.object.position.y = targetY;
					}
				}
			} else if (this.player.object.position.y>0){
                if (this.player.velocityY==undefined) this.player.velocityY = 0;
                this.player.velocityY += dt * gravity;
                this.player.object.position.y -= this.player.velocityY;
                if (this.player.object.position.y < 0){
                    this.player.velocityY = 0;
                    this.player.object.position.y = 0;
                }
            }
		}
        
        this.player.object.rotateY(this.player.move.turn*dt);
	}
    
	onWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize( window.innerWidth, window.innerHeight );

	}

    set action(name){
		const action = this.player.mixer.clipAction( this.animations[name] );
        action.time = 0;
		this.player.mixer.stopAllAction();
		this.player.action = name;
		this.player.clipAction = action;
		this.player.actionTime = Date.now();
        this.player.actionName = name;
		
		action.fadeIn(0.5);	
		action.play();
	}

	delayActionPause() {
		setTimeout(() => {
			this.player.clipAction.paused = true;
		}, 1000);
	}

    get action(){
        if (this.player===undefined || this.player.actionName===undefined) return "";
        return this.player.actionName;
    }
    
    playerControl(forward, turn){
		if(!this.player.spraying) {
			turn = -turn;
			if (forward>0.3){
				if (this.player.action!='Walking' && this.player.action!='Running') this.action = 'Walking';
			}else if (forward<-0.3){
				if (this.player.action!='Walking Backwards') this.action = 'Walking Backwards';
			}else{
				forward = 0;
				if (Math.abs(turn)>0.1){
					if (this.player.action != 'Turn') this.action = 'Turn';
				}else if (this.player.action!="Idle"){
					this.action = 'Idle';
				}
			}
			
			if (forward==0 && turn==0){
				delete this.player.move;
			}else{
				this.player.move = { forward, turn }; 
			}
		} else {
			forward = -forward;
			turn = -turn;

			const mX = new THREE.Matrix4().makeRotationX(forward);
			const mY = new THREE.Matrix4().makeRotationY(turn);
			const m = new THREE.Matrix4().multiplyMatrices( mX, mY );
			m.setPosition(this.player.cameras.active.position);
			this.player.cameras.active.matrix.copy(m);
		}
	}

    
    createCameras(){
		const offset = new THREE.Vector3(0, 80, 0);
		const front = new THREE.Object3D();
		front.position.set(112, 100, 600);
		front.parent = this.player.object;

		const fpsMiddle = new THREE.Object3D();
		fpsMiddle.position.set(-15, 100, 35);
		fpsMiddle.parent = this.player.object;
		const fps = new THREE.Object3D();
		fps.position.set(-15, 225, 35);
		fps.parent = this.player.object;
		const fpsFront = new THREE.Object3D();
		fpsFront.position.set(0, 0, 200);
		fpsFront.parent = fps;
		const fpsCan = new THREE.Object3D();
		fpsCan.position.set(-17, -10, 65);
		fpsCan.parent = fps;

		const back = new THREE.Object3D();
		back.position.set(0, 300, -600);
		back.parent = this.player.object;

		const wide = new THREE.Object3D();
		wide.position.set(178, 139, 1665);
		wide.parent = this.player.object;

		const overhead = new THREE.Object3D();
		overhead.position.set(0, 400, 0);
		overhead.parent = this.player.object;

		const collect = new THREE.Object3D();
		collect.position.set(40, 82, 94);
		collect.parent = this.player.object;

		this.player.cameras = { front, back, wide, overhead, collect, fps, fpsFront, fpsCan, fpsMiddle };
		this.player.cameras.active = this.player.cameras.back;
	}

	spray() {
		let geometry1 = new THREE.TetrahedronGeometry().scale(5, 5, 5);
		let geometry2 = new THREE.SphereGeometry().scale(5, 5, 5);
		let geometry3 = new THREE.DodecahedronGeometry().scale(5, 5, 5);
		let material = new THREE.MeshBasicMaterial( {color: this.player.sprayColourSelected} );
		let marking = new THREE.Mesh();
		marking.material = material;

		//random geometry selection
		let tempRandomDecimal = Math.random();
		if (tempRandomDecimal <= 0.33) {
			marking.geometry = geometry1;
		} else if (tempRandomDecimal > 0.33 && tempRandomDecimal <= 0.66){
			marking.geometry = geometry2;
		} else {
			marking.geometry = geometry3;
		}
		
		let worldPosCan = new THREE.Vector3();
		let worldDirCan = new THREE.Vector3();
		
		//sets the position of the marker
		this.player.cameras.fpsCan.getWorldPosition(worldPosCan);
		marking.position.set(worldPosCan.x, worldPosCan.y, worldPosCan.z);
		
		// Creates a raycaster for every marking
		let raycaster = new THREE.Raycaster(marking.position, worldDirCan);
		this.player.cameras.active.getWorldDirection(worldDirCan);
		marking.raycaster = raycaster;
		
		//adds the marker to the sprayMarkings array where it is translated on the active camera axis
		this.player.inFlightSprayMarkings.push(marking);
		this.scene.add(marking);

		// console.log(this.player.sprayMarkings);
		
	}

	animate() {
		const game = this;
		const dt = this.clock.getDelta();
		
		requestAnimationFrame( () => { game.animate(); } );
		
		if (this.player.inFlightSprayMarkings) {
			this.player.inFlightSprayMarkings.map(async (value, index, arr) => {
				if(value != undefined) {
					let intersect = value.raycaster.intersectObjects(this.colliders);
					if (intersect.length > 0 && intersect[0].distance < (this.player.particleSpeed * 2)) {

						//this make a final spray particle translation to ensure it sticks to the wall
						value.translateOnAxis(value.sprayDirection, intersect[0].distance);

						//for performance reasons the markers, after they have hit the object should
						//be removed from the inFlightSprayMarkings array 
						delete arr[index]

						this.player.landedSprayMarkings.push(value);
	
					} else {
						let playerDirection = new THREE.Vector3();
						if(value.sprayDirection) {
							value.translateOnAxis(value.sprayDirection, this.player.particleSpeed);
						} else {
							this.player.cameras.fpsCan.getWorldDirection(playerDirection);
							//randomises the direction of the graffiti spray marker
							playerDirection.x += (Math.random() - 0.5) / this.player.nozzelCoeff;
							playerDirection.y += (Math.random() - 0.5) / this.player.nozzelCoeff;
							playerDirection.z += (Math.random() - 0.5) / this.player.nozzelCoeff;
							value.sprayDirection = playerDirection;
							value.translateOnAxis(value.sprayDirection, this.player.particleSpeed);
						}

					}
				}
			})
		}
		if (this.player.mixer!==undefined) this.player.mixer.update(dt);
		
        if (this.player.action=='Walking'){
			const elapsedTime = Date.now() - this.player.actionTime;
			if (elapsedTime>1000 && this.player.move.forward>0){
				this.action = 'Running';
			}
		}
		// console.log("where is the can", this.player.sprayCan.position);
		if (this.player.move !== undefined) this.movePlayer(dt);
		
		if (this.player.cameras!=undefined && this.player.cameras.active!=undefined){
			if (this.player.cameras.active == this.player.cameras.fps) {
				//1st person perspective
				const cameraWorldPos = new THREE.Vector3();
				this.player.cameras.active.getWorldPosition(cameraWorldPos);
				this.camera.position.lerp(cameraWorldPos, 0.4);
				const faceThisVector = new THREE.Vector3();
				this.player.cameras.fpsFront.getWorldPosition(faceThisVector)
				this.camera.lookAt(faceThisVector);
				//move can to hand
				const worldPosCan = new THREE.Vector3();
				this.player.cameras.fpsCan.getWorldPosition(worldPosCan);
				this.player.sprayCan.position.set(worldPosCan.x, worldPosCan.y, worldPosCan.z);
				this.scene.add(this.player.sprayCan);
				
			} else if (this.player.cameras.active == this.player.cameras.back) {
				this.player.cameras.active = this.player.cameras.back;
				this.camera.position.lerp(this.player.cameras.active.getWorldPosition(new THREE.Vector3()), 0.05);
				const pos = this.player.object.position.clone();
				pos.y += 200;
				this.camera.lookAt(pos);
			}
		}
        
        if (this.sun != undefined){
            this.sun.position.x = this.player.object.position.x;
            this.sun.position.y = this.player.object.position.y + 200;
            this.sun.position.z = this.player.object.position.z + 100;
            this.sun.target = this.player.object;
        }
        
		this.renderer.render( this.scene, this.camera );

	}
}