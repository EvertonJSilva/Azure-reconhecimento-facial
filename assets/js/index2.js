    const URLAzure = 'https://xxxxxx.cognitiveservices.azure.com/face/v1.0/'
    const URLRotaDetect = 'detect?returnFaceId=true&returnFaceLandmarks=false&recognitionModel=recognition_03&returnRecognitionModel=false&detectionModel=detection_01'
    const URLRotaIdentify = 'identify'
    const ChaveApi = ''
    const GrupoAzure = ''

    let forwardTimes = []

    function updateTimeStats(timeInMs) {
      forwardTimes = [timeInMs].concat(forwardTimes).slice(0, 30)
      const avgTimeInMs = forwardTimes.reduce((total, t) => total + t) / forwardTimes.length
      $('#time').val(`${Math.round(avgTimeInMs)} ms`)
      $('#fps').val(`${faceapi.utils.round(1000 / avgTimeInMs)}`)
    }

    async function onPlay() {
      const videoEl = $('#inputVideo').get(0);
    
      if(videoEl.paused || videoEl.ended || !isFaceDetectionModelLoaded())
        return setTimeout(() => onPlay())

      const areaValida = await PosicionarRetangulo();
      
      const options = getFaceDetectorOptions()

      const ts = Date.now()

      const result = await faceapi.detectSingleFace(videoEl, options).withFaceLandmarks();

      updateTimeStats(Date.now() - ts)

      if (result && 
        (result.detection._box._x >= areaValida.leftMin-20 && result.detection._box._x <= areaValida.leftMax+20) &&
        (result.detection._box._y >= areaValida.topMin-20 && result.detection._box._y <= areaValida.topMax+20) 
        ){
        const canvas = $('#overlay').get(0)
        const dims = faceapi.matchDimensions(canvas, videoEl, true)

        const resizedDetections = faceapi.resizeResults(result, dims)
       // faceapi.draw.drawDetections(canvas, resizedDetections)
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)

        videoEl.pause()
        await capture(result.detection._box);

      }else{
        const canvas = $('#overlay').get(0)
        await canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
       
      }

      setTimeout(() => onPlay())
    }

    async function run() {
      
        alert('vai iniciar')
        // load face detection model
      await changeFaceDetector(TINY_FACE_DETECTOR)
      changeInputSize(512)

        // try to access users webcam and stream the images
        // to the video element
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} })
        const videoEl = $('#inputVideo').get(0)
        videoEl.srcObject = stream
    }

    function updateResults() {}

    $(document).ready(function() {

      // renderNavBar('#navbar', 'webcam_face_detection')
      initFaceDetectionControls()

    }
    )

    Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri('/assets/lib/face-api/models/'),
      faceapi.nets.tinyFaceDetector.loadFromUri('/assets/lib/face-api/models/'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/assets/lib/face-api/models/'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/assets/lib/face-api/models/'),
      faceapi.nets.faceExpressionNet.loadFromUri('/assets/lib/face-api/models/'),
      faceapi.nets.ageGenderNet.loadFromUri('/assets/lib/face-api/models/'),
      
  ]).then((values) => {
    console.log('Componente iniciado');
    run();
  });
  
  function TrocarTexto(texto) {
    var text = document.getElementById('textPosicao');
    text.innerHTML = texto ;
  
  }

  function TrocarCores(sucesso) {
    var aviso = document.getElementById('RetanguloAvisoPosicao');
    if(sucesso){
      aviso.style.background =  "#4caf50";
  
    }else{
      aviso.style.background = "#ff9800";
    }
  

  }

  async function PosicionarRetangulo() {
    var RetanguloPosicao = document.getElementById('RetanguloPosicao');
    var video = document.getElementById('inputVideo');
    var text = document.getElementById('textPosicao');
    var aviso = document.getElementById('RetanguloAvisoPosicao');

    var rect = video.getBoundingClientRect();

    var obj = {
      width:  200,
      height: 270,
      top:  rect.top+ (video.videoHeight/2)-(RetanguloPosicao.height/2) ,
      left: rect.left+(video.videoWidth/2)-(RetanguloPosicao.width/2),
      videoTop: rect.top,
      videoLeft: rect.left,
      leftMin: 0,
      leftMax: 0,
      topMin: 0,
      toptMax: 0,
      
    };

    obj.leftMin = obj.left-obj.videoLeft-20;
    obj.leftMax = obj.leftMin+30; //obj.leftMin+obj.width;
    obj.topMin = obj.top-obj.videoTop+50;
    obj.topMax = obj.topMin+30;


    RetanguloPosicao.width= obj.width;
    RetanguloPosicao.height=obj.height;
    RetanguloPosicao.style.top = obj.top+"px";
    RetanguloPosicao.style.left= obj.left+"px";

    text.style.top = rect.top-70+video.videoHeight+"px";
    text.style.left= obj.left+5+"px";

    aviso.style.top = rect.top-70+video.videoHeight+"px";
    aviso.style.left= rect.left+"px";
    aviso.style.height = 70+"px";
    aviso.style.width= video.videoWidth+"px";

    return obj; 
  }

  function getElementCSSSize(el) {
    var cs = getComputedStyle(el);
    var w = parseInt(cs.getPropertyValue("width"), 10);
    var h = parseInt(cs.getPropertyValue("height"), 10);
    return {width: w, height: h}
}


  async function capture(box) {
    var canvas = document.getElementById('captura');     
    var video = document.getElementById('inputVideo');
    const newImg = document.getElementById('myImg')	

    if(newImg.src != "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D"){
      return ''
    }
  
    TrocarCores('ok');
    TrocarTexto('Aguarde...consultando')
    canvas.width =  video.videoWidth;
    canvas.height =  video.videoHeight;

    canvas.getContext('2d').drawImage(video, 0,0, video.videoWidth, video.videoHeight); 
    var imgData = canvas.getContext('2d').getImageData(box._x, box._y, box._width, box._height);
     
    canvas.width =  box._width;
    canvas.height =  box._height;
    canvas.getContext('2d').putImageData(imgData, 0, 0);
    	
    newImg.width =  box._width;
    newImg.height =  box._height;
 
    canvas.toBlob(function(blob) {

      url = URL.createObjectURL(blob);
      newImg.onload = function() {
        // no longer need to read the blob so it's revoked
        URL.revokeObjectURL(url);

      };

      newImg.src = url;
      AzureDetect(blob);
  
    });
  }

   function Successo(candidate) {
    var texto = 'Sucesso! Taxa de acerto: '+ candidate.confidence + ' PessoaId:'+ candidate.personId 

    TrocarCores('ok');
    TrocarTexto( 'Sucesso! Taxa de acerto: '+ candidate.confidence);
    
    document.getElementById("txtEnvio").innerHTML=texto;
 
     limparFoto();
     iniciarVideo();
}

 function Erro(texto) {
    document.getElementById("txtEnvio").innerHTML=texto;

    console.log(texto);
    TrocarTexto(texto);

    limparFoto();
    pausarVideo();

}

  function AzureDetect(foto){

  var url = URLAzure+URLRotaDetect
  var myHeaders = new Headers();
  myHeaders.append("Ocp-Apim-Subscription-Key", ChaveApi);
  myHeaders.append("Content-Type", "application/octet-stream");

  fetch(url, {method:"POST", body:foto, headers: myHeaders})
          .then(response => {
            if (response.ok) return response;
            else throw Error(`Server returned ${response.status}: ${response.statusText}`)
          })
          .then(response => response.json())
          .then(data => { AzureIdentify(data[0].faceId) })                        
          .catch(err => {
            Erro('Não localizado!!! ');
          });

}

 function AzureIdentify(idDetect){

  var url = URLAzure+URLRotaIdentify
  var myHeaders = new Headers();
  myHeaders.append("Ocp-Apim-Subscription-Key", ChaveApi);
  myHeaders.append("Content-Type", "application/json");

  var json = '{ "largePersonGroupId": "'+GrupoAzure+ '", "faceIds": [ "'+idDetect+'" ], "maxNumOfCandidatesReturned": 1,"confidenceThreshold": 0.5 }'

  fetch(url,
        {method:"POST", body:json, headers: myHeaders})
          .then(response => {
            if (response.ok) return response;
            else throw Error(`Server returned ${response.status}: ${response.statusText}`)
          })
          .then(response => response.json())
          .then(data => { EnviarTelaERP(data[0].candidates[0]) })                        
          .catch(err => {
            Erro('Não localizado!!! ');
          });

}


 function EnviarTelaERP(candidate){

  var url = 'http://localhost:2001'
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW");

  var json ='----WebKitFormBoundary7MA4YWxkTrZu0gW'
  json = json +'Content-Disposition: form-data; name="pessoaid:"'
  json = json + candidate.personId
  json = json + '----WebKitFormBoundary7MA4YWxkTrZu0gW'
  

  fetch(url,
        {method:"POST", body:json, headers: myHeaders})
          .then(response => {
            if (response.ok) return response;
            else throw Error(`Server returned ${response.status}: ${response.statusText}`)
          })
          .then(response => response.json())
          .then(data => { Successo(candidate) })                        
          .catch(err => {
            Successo(candidate)
          });

}

function limparFoto(){
  const newImg = document.getElementById('myImg')	
  newImg.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D";
  TrocarTexto("POSICIONE O ROSTO");
  TrocarCores();
}

function iniciarVideo(){
  const videoEl = $('#inputVideo').get(0);
  videoEl.play();

}

function pausarVideo(){
  const videoEl = $('#inputVideo').get(0);
    videoEl.play();
}