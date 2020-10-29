class Game{
	constructor(){
		if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
		
		this.container;
		this.player = { };
		this.stats;
		this.controls;
		this.camera;
		this.scene;
		this.renderer;
		
		this.container = document.createElement( 'div' );
		this.container.style.height = '100%';
		document.body.appendChild( this.container );
        		
		this.assetsPath = './assets/';
		
		this.clock = new THREE.Clock();
        
        this.init();

		window.onError = function(error){
			console.error(JSON.stringify(error));
		}   
	}
	
	init() {

		this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
		this.camera.position.set(112, 100, 400);
        
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color( 0xa0a0a0 );
		this.scene.fog = new THREE.Fog( 0xa0a0a0, 200, 1000 );

		let light = new THREE.HemisphereLight( 0xffffff, 0x444444 );
		light.position.set( 0, 200, 0 );
		this.scene.add( light );

		light = new THREE.DirectionalLight( 0xffffff );
		light.position.set( 0, 200, 100 );
		light.castShadow = true;
		light.shadow.camera.top = 180;
		light.shadow.camera.bottom = -100;
		light.shadow.camera.left = -120;
		light.shadow.camera.right = 120;
		this.scene.add( light );

		// ground
		var mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2000, 2000 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
		mesh.rotation.x = - Math.PI / 2;
		//mesh.position.y = -100;
		mesh.receiveShadow = true;
		this.scene.add( mesh );

		var grid = new THREE.GridHelper( 2000, 40, 0x000000, 0x000000 );
		//grid.position.y = -100;
		grid.material.opacity = 0.2;
		grid.material.transparent = true;
		this.scene.add( grid );

        // Loading the playermodel
        var fbxLoader = new THREE.FBXLoader();
        var modelReady = false;
        this.player.loadedAnimations = new Array();
        this.player.activeAction = undefined;

        fbxLoader.load(
            `${this.assetsPath}rigs/mannequin/mannequin.fbx`,
            (object) => {
                object.scale.set(.30, .30, .30)
                this.player.mixer = new THREE.AnimationMixer(object);
                this.player.root = this.player.mixer.getRoot();
        
                this.scene.add(object);
        
                //add an animation from another file
                fbxLoader.load(`${this.assetsPath}rigs/mannequin/mannequin@idle.fbx`,
                    (object) => {
                        console.log("loaded idle");
                        let animationAction = this.player.mixer.clipAction(object.animations[0]);
                        this.player.loadedAnimations.push(animationAction);

                        //add an animation from another file
                        fbxLoader.load(`${this.assetsPath}rigs/mannequin/mannequin@jump.fbx`,
                            (object) => {
                                console.log("loaded jump");
                                let animationAction = this.player.mixer.clipAction(object.animations[0]);
                                this.player.loadedAnimations.push(animationAction);
        
                                //add an animation from another file
                                fbxLoader.load(`${this.assetsPath}rigs/mannequin/mannequin@walking.fbx`,
                                    (object) => {
                                        console.log("loaded walking");
                                        // makes model walk uncentered
                                        object.animations[0].tracks.shift();
                                        let animationAction = this.player.mixer.clipAction(object.animations[0]);
                                        this.player.loadedAnimations.push(animationAction);
                                        
                                        modelReady = true;
                                        this.animate();
                                        this.playLoadedAnimations();
                                    },
                                    (xhr) => {
                                        console.log((xhr.loaded / xhr.total * 100) + '% loaded')
                                    },
                                    (error) => {
                                        console.log(error);
                                    }
                                )
                            },
                            (xhr) => {
                                console.log((xhr.loaded / xhr.total * 100) + '% loaded')
                            },
                            (error) => {
                                console.log(error);
                            }
                        )
                    },
                    (xhr) => {
                        console.log((xhr.loaded / xhr.total * 100) + '% loaded')
                    },
                    (error) => {
                        console.log(error);
                    }
                )
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded')
            },
            (error) => {
                console.log(error);
            }
        )
        
		this.renderer = new THREE.WebGLRenderer( { antialias: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.shadowMap.enabled = true;
		this.container.appendChild( this.renderer.domElement );
        
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 150, 0);
        this.controls.update();
			
		window.addEventListener( 'resize', function(){ this.onWindowResize(); }, false );
	}
	
	onWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize( window.innerWidth, window.innerHeight );

	}

	animate() {
		const dt = this.clock.getDelta();
		
		requestAnimationFrame( () => { this.animate(); } );
		
		if (this.player.mixer!==undefined) this.player.mixer.update(dt);
		
        this.renderer.render( this.scene, this.camera );        
    }

    playLoadedAnimations() {
        this.player.loadedAnimations.forEach((action) => {
            action.setLoop(THREE.LoopOnce, 1).play();
            console.log("Playing action: "+action);
        });
    }

}