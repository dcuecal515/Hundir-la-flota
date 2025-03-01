import { Component,AfterViewInit, DoCheck } from '@angular/core';
import { WebsocketService } from '../../services/websocket.service';
import { RequestService } from '../../services/request.service';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { User } from '../../models/user';
import { delay, Subscription } from 'rxjs';
import { FriendRequest } from '../../models/FriendRequest';
import Swal from 'sweetalert2';
import { chatMessage } from '../../models/chatMessage';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-party',
  standalone: true,
  imports: [],
  templateUrl: './party.component.html',
  styleUrl: './party.component.css'
})

export class PartyComponent implements AfterViewInit,DoCheck {
  constructor(private webSocketService:WebsocketService,private requestService:RequestService,private router:Router,private dataService:DataService,private apiService:ApiService){
      if(localStorage.getItem("token")){
            this.decoded=jwtDecode(localStorage.getItem("token"));
          }else if(sessionStorage.getItem("token")){
            this.decoded=jwtDecode(sessionStorage.getItem("token"));
          }else{
            // router.navigateByUrl("login")
            this.decoded=null
          }
  }
  decoded:User;
  messageReceived$: Subscription;
  disconnected$: Subscription;
  isConnected: boolean = false;
  opponentName:string = "Bot1"
  items=[1,2,3,4,5,6,7,8,9,10]
  letras=['a','b','c','d','e','f','g','h','i','j']
  barcos:string[][]=[]
  shoots=[]
  barcosoponente=false 
  barcosBot=false
  turn=false
  impacted=false
  timeStoped = false
  timeString:string="2:00"
  chatContent:chatMessage[] = []
  barco:string[]=[]
  altura:number
  ancho:number
  quitar:boolean=false
  timerInterval:any
  isRequestedRematch:boolean = false

  ngDoCheck() {
    if (this.barcos.length === 4 && !this.timeStoped) {
      this.stopTimerfuction();
    }
  }

  ngOnInit(): void {
    // history.pushState(null, "", location.href);
    this.messageReceived$ = this.webSocketService.messageReceived.subscribe(async message => {
      if(message.message=="amigo conectado"){
        console.log("HOLAAAA")
        console.log("Ahora tu amigo se ha conectado:"+message.friendId)
        this.dataService.players=message.quantity
        this.dataService.playersPlaying=message.quantityplayer
        this.dataService.games=message.quantitygame
      }
      if(message.message=="usuarios conectados"){
        console.log("La cantidad de usuarios que ahi ahora conectados son: "+message.quantity)
        this.dataService.players=message.quantity
        this.dataService.playersPlaying=message.quantityplayer
        this.dataService.games=message.quantitygame
      }
      if(message.message=="usuarios desconectados"){
        console.log("HOLAAAA")
        console.log("Se ha desconectado un usuario ahora quedan:"+message.quantity)
        this.dataService.players=message.quantity
        this.dataService.playersPlaying=message.quantityplayer
        this.dataService.games=message.quantitygame
      }
      if(message.message=="amigo desconectado"){
        console.log("Ahora tu amigo se ha desconectado:"+message.friendId)
        this.dataService.players=message.quantity
      }
      if(message.message == "Datos iniciales"){
        console.log("Te enfrentas a "+message.nickName)
        this.opponentName = message.nickName
      }
      if(message.message=="Empezo la partida"){
        console.log("Empezaste la partida con "+message.opponentId)
        const messageToSend:FriendRequest={TypeMessage:"Envio de oponentes",Identifier:message.opponentId.toString()}
        const jsonData = JSON.stringify(messageToSend)
        console.log(jsonData)
        this.webSocketService.sendRxjs(jsonData)
      }
      if(message.message=="Has ganado"){
        console.log("has ganado contra "+this.opponentName)
        this.router.navigateByUrl("menu")
      }
      if(message.message=="Disparo enemigo"){
        console.log("Te dispararon en la posición: "+message.position)
        const myPosition = document.getElementById(message.position)
        if(message.impacted){
          myPosition.style.backgroundColor='green'
        }else{
          myPosition.style.backgroundColor='red'
        }
        Swal.fire({
          title: 'Te toca disparar',
          icon: 'success',
          timer: 1000, 
          showConfirmButton: false
        });
        this.turn=true
        this.startTimer()
      }
      if(message.message=="Tu disparo ha sido enviado"){
        const opponentPosition = document.getElementById(message.position+"enemigo")
        if(message.impacted){
          opponentPosition.classList.remove("game-box")
          opponentPosition.classList.add("game-box-touched")
        }else{
          opponentPosition.classList.remove("game-box")
          opponentPosition.classList.add("game-box-miss")
        }
      }
      if(message.message=="Has ganado la parida"){
        const opponentPosition = document.getElementById(message.position+"enemigo")
        opponentPosition.classList.remove("game-box")
        opponentPosition.classList.add("game-box-touched")

        const alertWin = await Swal.fire({
          title: 'Victoria',
          text: 'Has ganado la partida, quieres revancha? \nPuntuaciones:\nTu: '+message.yourScore+"\n"+this.opponentName+": "+message.opponentScore,
          icon: 'success',
          confirmButtonText:"Aceptar",
          cancelButtonText:"Cancelar",
          showConfirmButton: true,
          showCancelButton:true
        });
        if(alertWin.isConfirmed){
          if(!this.isRequestedRematch){
            const messageToSend:FriendRequest={TypeMessage:"Quiere revancha primero",Identifier:this.opponentName}
            const jsonData = JSON.stringify(messageToSend)
            console.log(jsonData)
            this.webSocketService.sendRxjs(jsonData)
          }else{
            const messageToSend:FriendRequest={TypeMessage:"Acepta la revancha",Identifier:this.opponentName}
            const jsonData = JSON.stringify(messageToSend)
            console.log(jsonData)
            this.webSocketService.sendRxjs(jsonData)
            this.router.navigateByUrl("matchmaking")
            const message:FriendRequest={TypeMessage:"ir a revancha",Identifier:this.opponentName}
            const jsonData2 = JSON.stringify(message)
            console.log(jsonData2)
            this.webSocketService.sendRxjs(jsonData2)
          }
        }
        if(alertWin.isDismissed){
          this.router.navigateByUrl("menu")
          const messageToSend:FriendRequest={TypeMessage:"No quiere revancha",Identifier:this.opponentName}
          const jsonData = JSON.stringify(messageToSend)
          console.log(jsonData)
          this.webSocketService.sendRxjs(jsonData)
        }
      }
      if(message.message=="Has perdido la partida"){
        const myPosition = document.getElementById(message.position)
        myPosition.style.backgroundColor='green'

        const alertWin = await Swal.fire({
          title: 'Derrota',
          text: 'Has perdido la partida, quieres revancha? \nPuntuaciones:\nTu: '+message.yourScore+"\n"+this.opponentName+": "+message.opponentScore,
          icon: 'error',
          confirmButtonText:"Aceptar",
          cancelButtonText:"Cancelar",
          showConfirmButton: true,
          showCancelButton:true
        });
        if(alertWin.isConfirmed){
          if(!this.isRequestedRematch){
            const messageToSend:FriendRequest={TypeMessage:"Quiere revancha primero",Identifier:this.opponentName}
            const jsonData = JSON.stringify(messageToSend)
            console.log(jsonData)
            this.webSocketService.sendRxjs(jsonData)
          }else{
            const messageToSend:FriendRequest={TypeMessage:"Acepta la revancha",Identifier:this.opponentName}
            const jsonData = JSON.stringify(messageToSend)
            console.log(jsonData)
            this.webSocketService.sendRxjs(jsonData)
            this.router.navigateByUrl("matchmaking")
            const message:FriendRequest={TypeMessage:"ir a revancha",Identifier:this.opponentName}
            const jsonData2 = JSON.stringify(message)
            console.log(jsonData2)
            this.webSocketService.sendRxjs(jsonData2)
          }
        }
        if(alertWin.isDismissed){
          this.router.navigateByUrl("menu")
          const messageToSend:FriendRequest={TypeMessage:"No quiere revancha",Identifier:this.opponentName}
          const jsonData = JSON.stringify(messageToSend)
          console.log(jsonData)
          this.webSocketService.sendRxjs(jsonData)
        }
      }
      if(message.message=="Se te acabo el tiempo"){
        console.log("Se te ha acabado el tiempo")
        this.router.navigateByUrl("menu")
        const messageToSend:FriendRequest={TypeMessage:"Abandono de partida",Identifier:this.opponentName}
        const jsonData = JSON.stringify(messageToSend)
        console.log(jsonData)
        this.webSocketService.sendRxjs(jsonData)
      }
      if(message.message=="Tu oponente coloco los barcos primero"){
        console.log("Tu oponete es mas rapido")
        this.barcosoponente=true
      }
      if(message.message=="Empiezas tu"){
        console.log("te toca atacar")
        this.startTimer()
        this.barcosoponente=true
        this.turn = true
      }
      if(message.message=="Te llego un mensaje"){
        const chatMessageToSave:chatMessage = {userName:this.opponentName,message:message.messageToOpponent} 
        this.chatContent.push(chatMessageToSave)
      }
      if(message.message=="Ya estan los barcos"){
        this.barcosBot=true
        this.turn=true
        this.startTimer()
      }
      if(message.message=="Respuesta del bot"){
        console.log("llegue aqui")
        const opponentPosition = document.getElementById(message.yourShoot+"enemigo")
        const myPosition = document.getElementById(message.botAtack)
        if(message.yourImpacted){
          opponentPosition.classList.remove("game-box")
          opponentPosition.classList.add("game-box-touched")
        }else{
          opponentPosition.classList.remove("game-box")
          opponentPosition.classList.add("game-box-miss")
        }
        if(message.botImpacted){
          myPosition.style.backgroundColor='green'
        }else{
          myPosition.style.backgroundColor='red'
        }
        this.turn=true
        this.startTimer()
      }
      if(message.message=="Has ganado al bot"){
        const alertWin = await Swal.fire({
          title: 'Victoria',
          text: 'Has ganado a nuestro bot enhorabuena, quieres revancha? \nPuntuaciones:\nTu: '+message.yourScore+"\nBot1: "+message.opponentScore,
          icon: 'success',
          confirmButtonText:"Aceptar",
          cancelButtonText:"Cancelar",
          showConfirmButton: true,
          showCancelButton:true
        });
        if(alertWin.isDismissed){
          this.router.navigateByUrl("menu")
          const message:FriendRequest={TypeMessage:"termino la parida contra bot"}
          const jsonData = JSON.stringify(message)
          console.log(jsonData)
          this.webSocketService.sendRxjs(jsonData)
        }
        if(alertWin.isConfirmed){
          // Volver al principio
          this.router.navigateByUrl("matchmaking")
          const message:FriendRequest={TypeMessage:"solicitud de partida contra bot"}
          const jsonData = JSON.stringify(message)
          console.log(jsonData)
          this.webSocketService.sendRxjs(jsonData)
        }
        
      }
      if(message.message=="Te gano el bot"){
        console.log("Estoy aqui")
        
        const alertDefeat = await Swal.fire({
          title: 'Derrota',
          text: 'Has perdido contra nuestro bot, quieres revancha? \nPuntuaciones:\nTu: '+message.yourScore+"\nBot1: "+message.opponentScore,
          icon: 'error',
          confirmButtonText:"Aceptar",
          cancelButtonText:"Cancelar",
          showConfirmButton: true,
          showCancelButton:true
        });
        if(alertDefeat.isDismissed){
          this.router.navigateByUrl("menu")
          const message:FriendRequest={TypeMessage:"termino la parida contra bot"}
          const jsonData = JSON.stringify(message)
          console.log(jsonData)
          this.webSocketService.sendRxjs(jsonData)
        }
        if(alertDefeat.isConfirmed){
          this.router.navigateByUrl("matchmaking")
          const message:FriendRequest={TypeMessage:"solicitud de partida contra bot"}
          const jsonData = JSON.stringify(message)
          console.log(jsonData)
          this.webSocketService.sendRxjs(jsonData)
        }
      }
      if(message.message=="Tu oponente rechazo la revancha"){
        Swal.fire({
          title: 'Partida terminada',
          text: 'Tu opponente no quiere revancha',
          icon: 'error',
          timer: 1000,
          showConfirmButton: false
        });
        this.router.navigateByUrl("menu")
      }
      if(message.message=="Tu oponente quiere revancha"){
        this.isRequestedRematch=true
      }
      if(message.message=="Tu oponente aceptó la revancha"){
        this.router.navigateByUrl("matchmaking")
        const message:FriendRequest={TypeMessage:"ir a revancha",Identifier:this.opponentName}
        const jsonData = JSON.stringify(message)
        console.log(jsonData)
        this.webSocketService.sendRxjs(jsonData)
      }
      if(message.message=="Has sido baneado"){
        const messageToSend:FriendRequest={TypeMessage:"Abandono de partida",Identifier:this.opponentName}
        const jsonData = JSON.stringify(messageToSend)
        console.log(jsonData)
        this.webSocketService.sendRxjs(jsonData)
        this.apiService.deleteToken();
        this.webSocketService.disconnectRxjs();
        this.router.navigateByUrl("/login");
      }
    });
    this.disconnected$ = this.webSocketService.disconnected.subscribe(() =>{
      const messageToSend:FriendRequest={TypeMessage:"Abandono de partida",Identifier:this.opponentName}
      const jsonData = JSON.stringify(messageToSend)
      console.log(jsonData)
      this.webSocketService.sendRxjs(jsonData)

      this.isConnected = false
    });
    this.startTimer()
    if(this.dataService.opponentName != ""){
      this.opponentName=this.dataService.opponentName
      this.dataService.opponentName=""
    }
  }

  guardarposicion(letra:string,item:number){

    if(this.barcosBot && this.opponentName=="Bot1" && this.turn){
      var miposicion:string=letra+item
      if(!this.shoots.includes(miposicion)){
        this.shoots.push(miposicion)
        var gamebox=document.getElementById(miposicion+"enemigo")
        gamebox.classList.remove("game-box")
        gamebox.classList.add("game-box-view")
        console.log("Posición mandada: "+miposicion)
        const messageToSend:FriendRequest={TypeMessage:"Disparo a bot",Identifier:miposicion}
        const jsonData = JSON.stringify(messageToSend)
        console.log(jsonData)
        this.webSocketService.sendRxjs(jsonData)
        this.turn = false
        clearInterval(this.timerInterval);
      }else{
        Swal.fire({
          title: 'Error',
          text: 'Selecciona una posicion nueva',
          icon: 'error',
          timer: 1000,
          showConfirmButton: false
        });
      }
    }else if(this.barcosoponente && this.barcos.length > 0 && this.turn){
      var miposicion:string=letra+item
      if(!this.shoots.includes(miposicion)){
        this.shoots.push(miposicion)
        var gamebox=document.getElementById(miposicion+"enemigo")
        gamebox.classList.remove("game-box")
        gamebox.classList.add("game-box-view")
        console.log("Posición mandada: "+miposicion)
        const messageToSend:FriendRequest={TypeMessage:"Disparo",Identifier:this.opponentName,Identifier2:miposicion}
        const jsonData = JSON.stringify(messageToSend)
        console.log(jsonData)
        this.webSocketService.sendRxjs(jsonData)
        this.turn = false
        clearInterval(this.timerInterval);
      }else{
        Swal.fire({
          title: 'Error',
          text: 'Selecciona una posicion nueva',
          icon: 'error',
          timer: 1000,
          showConfirmButton: false
        });
      }
    }else{
      Swal.fire({
        title: 'Error',
        text: 'Todavia no puedes atacar',
        icon: 'error',
        timer: 1000, 
        showConfirmButton: false
      });
    }
    
  }

  async exit(){
    const exitRequest = await Swal.fire({
                            title: "Abandonar partida",
                            text: "¿Estás seguro que quieres abandonar la partida?",
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonText: "Aceptar",
                            cancelButtonText: "Cancelar"
                          });
                          if (exitRequest.isConfirmed) {
                            this.router.navigateByUrl("menu")
                            const messageToSend:FriendRequest={TypeMessage:"Abandono de partida",Identifier:this.opponentName}
                            const jsonData = JSON.stringify(messageToSend)
                            console.log(jsonData)
                            this.webSocketService.sendRxjs(jsonData)
                          } else {
                            Swal.close()
                          }
    
  }

  async startTimer(){
    var timeSeconds=120
    this.timeString="2:00"
    this.timerInterval = setInterval(() => {
      if (timeSeconds <= 0) {
        clearInterval(this.timerInterval);
        return;
      }
  
      timeSeconds--; // Reducir el tiempo
      const minutes = Math.floor(timeSeconds / 60);
      const seconds = timeSeconds % 60;
      this.timeString = minutes + ":" + seconds.toString().padStart(2, '0');
    }, 1000);
  }

  stopTimerfuction(){
    console.log(this.opponentName)
    if(this.barcos.length == 4){
      this.timeStoped = true
      clearInterval(this.timerInterval);
      if(this.barcosoponente){
        const messageToSend:FriendRequest={TypeMessage:"Yo tambien los coloque",Identifier:this.opponentName,Identifier2:JSON.stringify(this.barcos)}
        const jsonData = JSON.stringify(messageToSend)
        console.log(jsonData)
        this.webSocketService.sendRxjs(jsonData)
      }else{
        if(this.opponentName=="Bot1"){
          const messageToSend:FriendRequest={TypeMessage:"Mis barcos contra bot",Identifier:JSON.stringify(this.barcos)}
          const jsonData = JSON.stringify(messageToSend)
          console.log(jsonData)
          this.webSocketService.sendRxjs(jsonData)
        }else{
          const messageToSend:FriendRequest={TypeMessage:"He colocado mis barcos",Identifier:this.opponentName,Identifier2:JSON.stringify(this.barcos)}
          const jsonData = JSON.stringify(messageToSend)
          console.log(jsonData)
          this.webSocketService.sendRxjs(jsonData)
        }
      }
    }else{
      Swal.fire({
        title: 'Error',
        text: 'Coloca todos los barcos para continuar',
        icon: 'error',
        timer: 1000, 
        showConfirmButton: false
      });
    }
  }

  sendChat(){
    const textInput = document.getElementById("chat") as HTMLInputElement
    const text = textInput.value
    if(text != ""){
      const chatMessageToSave:chatMessage = {userName:"Yo",message:text} 
      this.chatContent.push(chatMessageToSave)
      const messageToSend:FriendRequest={TypeMessage:"Mensaje de texto",Identifier:this.opponentName, Identifier2:text}
      const jsonData = JSON.stringify(messageToSend)
      console.log(jsonData)
      this.webSocketService.sendRxjs(jsonData)
      textInput.value = ""
    }
  }

  ngOnDestroy(): void {
    this.messageReceived$.unsubscribe();
    this.disconnected$.unsubscribe();
  }
  
  ngAfterViewInit() {
    const dropzones = document.querySelectorAll('.game-box');
    const draggablebarco4 = document.getElementById('barco4');
    const draggablebarco3=document.getElementById('barco3')
    const draggablebarco32=document.getElementById('barco32')
    const draggablebarco2=document.getElementById('barco2')
    draggablebarco4.addEventListener('dragstart', (event) => {
      console.log(event)
      this.altura=event.offsetY
      this.ancho=event.offsetX
      console.log('La posición del clic (altura) dentro del div es: ', this.altura);
      console.log('La posición del clic (anchura) dentro del div es: ',this.ancho)
      console.log('Altura total del div: ', draggablebarco4.offsetHeight);
      console.log('Anchura total del div: ',draggablebarco4.offsetWidth);
      event.dataTransfer.setData('text/plain', draggablebarco4.id);
      console.log('Estoy arrastrando mi elemento');
    });
    draggablebarco3.addEventListener('dragstart', (event) => {
      console.log(event)
      this.altura=event.offsetY
      this.ancho=event.offsetX
      console.log('La posición del clic (altura) dentro del div es: ', this.altura);
      console.log('La posición del clic (anchura) dentro del div es: ',this.ancho)
      console.log('Altura total del div: ', draggablebarco3.offsetHeight);
      console.log('Anchura total del div: ',draggablebarco3.offsetWidth);
      event.dataTransfer.setData('text/plain', draggablebarco3.id);
      console.log('Estoy arrastrando mi elemento');
    });
    draggablebarco32.addEventListener('dragstart', (event) => {
      console.log(event)
      this.altura=event.offsetY
      this.ancho=event.offsetX
      console.log('La posición del clic (altura) dentro del div es: ', this.altura);
      console.log('La posición del clic (anchura) dentro del div es: ',this.ancho)
      console.log('Altura total del div: ', draggablebarco32.offsetHeight);
      console.log('Anchura total del div: ',draggablebarco32.offsetWidth);
      event.dataTransfer.setData('text/plain', draggablebarco32.id);
      console.log('Estoy arrastrando mi elemento');
    });
    draggablebarco2.addEventListener('dragstart', (event) => {
      console.log(event)
      this.altura=event.offsetY
      this.ancho=event.offsetX
      console.log('La posición del clic (altura) dentro del div es: ', this.altura);
      console.log('La posición del clic (anchura) dentro del div es: ',this.ancho)
      console.log('Altura total del div: ', draggablebarco2.offsetHeight);
      console.log('Anchura total del div: ',draggablebarco2.offsetWidth);
      event.dataTransfer.setData('text/plain', draggablebarco2.id);
      console.log('Estoy arrastrando mi elemento');
    });
    dropzones.forEach(dropzone => {
      dropzone.addEventListener("dragover", (ev:DragEvent) => ev.preventDefault());
      dropzone.addEventListener("drop", (ev:DragEvent) => {
        const idelemento = ev.dataTransfer.getData("text/plain");
        /*const item = document.querySelector("#" + idelemento);*/
        const Idsuelto=dropzone.id
        const padre=document.getElementById(idelemento)
        const hijos=padre.children
        const clase=padre.className
        let numero
        console.log("Mis hijos len: "+hijos.length)
        console.log("MI ID ES: ",idelemento)
        console.log("Mis hijos son",hijos)
        console.log("Mi clase del padre",clase)
        console.log('posicon donde he soltado mi barco', Idsuelto);
        console.log('altura a donde pincho '+this.altura)
        if(clase=="barco4-column"||clase=="barco3-column" ||clase=="barco32-column"||clase=="barco2-column"){
          this.quitar=false
          if(this.altura>0 && this.altura<=54){
            console.log("Pongo la posicion uno")
            console.log("Esta seria mi letra"+Idsuelto[0])
            if(hijos.length==4 && (Idsuelto[0]=="j" || Idsuelto[0]=="h" || Idsuelto[0]=="i")){
              Swal.fire({
                title: 'Error',
                text: 'No puedes colocar el barco aqui no hay espacio suficiente',
                icon: 'error',
                timer: 1000, 
                showConfirmButton: false
              });
              return
            }else if(hijos.length==3 && (Idsuelto[0]=="j" || Idsuelto[0]=="i")){
              Swal.fire({
                title: 'Error',
                text: 'No puedes colocar el barco aqui no hay espacio suficiente',
                icon: 'error',
                timer: 1000, 
                showConfirmButton: false
              });
              return
            }else if(hijos.length==2 && Idsuelto[0]=="j" ){
              Swal.fire({
                title: 'Error',
                text: 'No puedes colocar el barco aqui no hay espacio suficiente',
                icon: 'error',
                timer: 1000, 
                showConfirmButton: false
              });
                return
            }else{
              const letra=Idsuelto[0]
            if(Idsuelto.length<3){
              numero=Idsuelto[1]
            }else{
              numero=Idsuelto[1]+Idsuelto[2]
            }
            this.barco = [];
            this.barco.push(Idsuelto)
            let indice=this.letras.indexOf(letra)
            for(let i=0; i<hijos.length-1; i++){
              indice+=1
              let letra=this.letras[indice]
              console.log(letra)
              let posicion=letra+numero
              console.log(posicion)
              this.barco.push(posicion)
            }
            console.log("Mi barco es: "+this.barco)
            let terminar=false
            if(this.barcos.length>=1){
              console.log("ENTREEEEE")
              this.barcos.forEach(barcoposiciones => {
                console.log("ENTRREEEEEEE")
                barcoposiciones.forEach(posicion => {
                  console.log("ENTRRREEEEEE")
                  if(this.barco.includes(posicion)){
                    console.log("ENTRRRRRREEEEEEEEE")
                    terminar=true
                  }
                });
              });
              console.log(terminar)
              if(!terminar){
                this.barcos.push(this.barco)
                for(let i=0; i<hijos.length; i++){
                  let posicion=document.getElementById(this.barco[i])
                  posicion.style.background='grey'
                }
                this.quitar=true
              }else{
                Swal.fire({
                  title: 'Error',
                  text: 'Has puesto el barco en una posicion donde ya ahi un barco ponlo en otro lado',
                  icon: 'error',
                  timer: 1000, 
                  showConfirmButton: false
                });
              }
            }else{
              this.barcos.push(this.barco)
              for(let i=0; i<hijos.length; i++){
                let posicion=document.getElementById(this.barco[i])
                posicion.style.background='grey'
              }
              this.quitar=true
            }
            console.log(this.quitar)
            console.log("Mi lista de barcos: ",this.barcos)
            }
          }
          if(this.altura>54 && this.altura<=108){
            console.log("Pongo la posicion dos")
            console.log("Esta seria mi letra"+Idsuelto[0])
            if(hijos.length==4 && (Idsuelto[0]=="a" || Idsuelto[0]=="j" || Idsuelto[0]=="i")){
              Swal.fire({
                title: 'Error',
                text: 'No puedes colocar el barco aqui no hay espacio suficiente',
                icon: 'error',
                timer: 1000, 
                showConfirmButton: false
              });
              return
            }else if(hijos.length==3 && (Idsuelto[0]=="a" || Idsuelto[0]=="j")){
              Swal.fire({
                title: 'Error',
                text: 'No puedes colocar el barco aqui no hay espacio suficiente',
                icon: 'error',
                timer: 1000, 
                showConfirmButton: false
              });
              return
            }else if(hijos.length==2 && Idsuelto[0]=="a" ){
              Swal.fire({
                title: 'Error',
                text: 'No puedes colocar el barco aqui no hay espacio suficiente',
                icon: 'error',
                timer: 1000, 
                showConfirmButton: false
              });
              return
            }else{
              const letra=Idsuelto[0]
            if(Idsuelto.length<3){
              numero=Idsuelto[1]
            }else{
              numero=Idsuelto[1]+Idsuelto[2]
            }
            this.barco = [];
            let indice=this.letras.indexOf(letra)
            this.barco.push(this.letras[indice-1]+numero)
            this.barco.push(Idsuelto)
            if(hijos.length<4){
              this.barco.push(this.letras[indice+1]+numero)
            }else{
              for(let i=0; i<2; i++){
                indice+=1
                let letra=this.letras[indice]
                console.log(letra)
                let posicion=letra+numero
                console.log(posicion)
                this.barco.push(posicion)
              }
            }
            console.log("Mi barco es: "+this.barco)
            let terminar=false
            if(this.barcos.length>=1){
              console.log("ENTREEEEE")
              this.barcos.forEach(barcoposiciones => {
                console.log("ENTRREEEEEEE")
                barcoposiciones.forEach(posicion => {
                  console.log("ENTRRREEEEEE")
                  if(this.barco.includes(posicion)){
                    console.log("ENTRRRRRREEEEEEEEE")
                    terminar=true
                  }
                });
              });
              console.log(terminar)
              if(!terminar){
                this.barcos.push(this.barco)
                for(let i=0; i<hijos.length; i++){
                  let posicion=document.getElementById(this.barco[i])
                  posicion.style.background='grey'
                }
                this.quitar=true
              }else{
                Swal.fire({
                  title: 'Error',
                  text: 'Has puesto el barco en una posicion donde ya ahi un barco ponlo en otro lado',
                  icon: 'error',
                  timer: 1000, 
                  showConfirmButton: false
                });
              }
            }else{
              this.barcos.push(this.barco)
              for(let i=0; i<hijos.length; i++){
                let posicion=document.getElementById(this.barco[i])
                posicion.style.background='grey'
              }
              this.quitar=true
            }
            console.log(this.quitar)
            console.log("Mi lista de barcos: "+this.barcos)
            }
            
          }
          if(this.altura>108 && this.altura<=162){
            console.log("Pongo la posicion tres")
            if(hijos.length==4 && (Idsuelto[0]=="a" || Idsuelto[0]=="j" || Idsuelto[0]=="b")){
              Swal.fire({
                title: 'Error',
                text: 'No puedes colocar el barco aqui no hay espacio suficiente',
                icon: 'error',
                timer: 1000, 
                showConfirmButton: false
              });
              return
            }else if(hijos.length==3 && (Idsuelto[0]=="a" || Idsuelto[0]=="b")){
              Swal.fire({
                title: 'Error',
                text: 'No puedes colocar el barco aqui no hay espacio suficiente',
                icon: 'error',
                timer: 1000, 
                showConfirmButton: false
              });
              return
            }else{
              let posicionesanteriores=[]
            console.log("Esta seria mi letra"+Idsuelto[0])
            const letra=Idsuelto[0]
            if(Idsuelto.length<3){
              numero=Idsuelto[1]
            }else{
              numero=Idsuelto[1]+Idsuelto[2]
            }
            this.barco = [];
            let indice=this.letras.indexOf(letra)
            let indicesecundario=this.letras.indexOf(letra)
            for(let i=0; i<2; i++){
              indicesecundario-=1
              let letra=this.letras[indicesecundario]
              console.log(letra)
              let posicion=letra+numero
              console.log(posicion)
              posicionesanteriores.push(posicion)
            }
            posicionesanteriores=posicionesanteriores.reverse()
            for(let i=0; i<2; i++){
              this.barco.push(posicionesanteriores[i])
            }
            this.barco.push(Idsuelto)
            if(hijos.length>=4){
              this.barco.push(this.letras[indice+1]+numero)
            }
            let terminar=false
            if(this.barcos.length>=1){
              console.log("ENTREEEEE")
              this.barcos.forEach(barcoposiciones => {
                console.log("ENTRREEEEEEE")
                barcoposiciones.forEach(posicion => {
                  console.log("ENTRRREEEEEE")
                  if(this.barco.includes(posicion)){
                    console.log("ENTRRRRRREEEEEEEEE")
                    terminar=true
                  }
                });
              });
              console.log(terminar)
              if(!terminar){
                this.barcos.push(this.barco)
                for(let i=0; i<hijos.length; i++){
                  let posicion=document.getElementById(this.barco[i])
                  posicion.style.background='grey'
                }
                this.quitar=true
              }else{
                Swal.fire({
                  title: 'Error',
                  text: 'Has puesto el barco en una posicion donde ya ahi un barco ponlo en otro lado',
                  icon: 'error',
                  timer: 1000, 
                  showConfirmButton: false
                });
              }
            }else{
              this.barcos.push(this.barco)
              for(let i=0; i<hijos.length; i++){
                let posicion=document.getElementById(this.barco[i])
                posicion.style.background='grey'
              }
              this.quitar=true
            }
            console.log(this.quitar)
            console.log("Mi lista de barcos: "+this.barcos)
            }
          }
          if(this.altura>162 && this.altura<=220){
            console.log("pongo la posicion cuatro")
            if(Idsuelto[0]=="a"|| Idsuelto[0]=="b" || Idsuelto[0]=="c"){
              Swal.fire({
                title: 'Error',
                text: 'No puedes colocar el barco aqui no hay espacio suficiente',
                icon: 'error',
                timer: 1000, 
                showConfirmButton: false
              });
              return
            }else{
              let posicionesanteriores=[]
            console.log("Esta seria mi letra"+Idsuelto[0])
            const letra=Idsuelto[0]
            if(Idsuelto.length<3){
              numero=Idsuelto[1]
            }else{
              numero=Idsuelto[1]+Idsuelto[2]
            }
            this.barco = [];
            let indice=this.letras.indexOf(letra)
            for(let i=0; i<3; i++){
              indice-=1
              let letra=this.letras[indice]
              console.log(letra)
              let posicion=letra+numero
              console.log(posicion)
              posicionesanteriores.push(posicion)
            }
            posicionesanteriores=posicionesanteriores.reverse()
            for(let i=0; i<3; i++){
              this.barco.push(posicionesanteriores[i])
            }
            this.barco.push(Idsuelto)
            console.log("Mi barco es: "+this.barco)
            let terminar=false
            if(this.barcos.length>=1){
              console.log("ENTREEEEE")
              this.barcos.forEach(barcoposiciones => {
                console.log("ENTRREEEEEEE")
                barcoposiciones.forEach(posicion => {
                  console.log("ENTRRREEEEEE")
                  if(this.barco.includes(posicion)){
                    console.log("ENTRRRRRREEEEEEEEE")
                    terminar=true
                  }
                });
              });
              console.log(terminar)
              if(!terminar){
                this.barcos.push(this.barco)
                for(let i=0; i<hijos.length; i++){
                  let posicion=document.getElementById(this.barco[i])
                  posicion.style.background='grey'
                }
                this.quitar=true
              }else{
                Swal.fire({
                  title: 'Error',
                  text: 'Has puesto el barco en una posicion donde ya ahi un barco ponlo en otro lado',
                  icon: 'error',
                  timer: 1000, 
                  showConfirmButton: false
                });
              }
            }else{
              this.barcos.push(this.barco)
              for(let i=0; i<hijos.length; i++){
                let posicion=document.getElementById(this.barco[i])
                posicion.style.background='grey'
              }
              this.quitar=true
            }
            console.log(this.quitar)
            console.log("Mi lista de barcos: "+this.barcos)
          }
          } 
        }
        if(clase=="barco4-row"||clase=="barco3-row"||clase=="barco32-row"||clase=="barco2-row"){
          this.quitar=false
          if(this.ancho>0 && this.ancho<=54){
            console.log("Pongo la posicion uno")
            console.log("Esta seria mi letra: "+Idsuelto[0])
            const letra=Idsuelto[0]
            if(Idsuelto.length<3){
              numero=Idsuelto[1]
            }else{
              numero=Idsuelto[1]+Idsuelto[2]
            }
            if(hijos.length==4 && (numero=="10" || numero=="9" || numero=="8")){
              Swal.fire({
                title: 'Error',
                text: 'No puedes colocar el barco aqui no hay espacio suficiente',
                icon: 'error',
                timer: 1000, 
                showConfirmButton: false
              });
              return
            }else if(hijos.length==3 && (numero=="10" || numero=="9")){
              Swal.fire({
                title: 'Error',
                text: 'No puedes colocar el barco aqui no hay espacio suficiente',
                icon: 'error',
                timer: 1000, 
                showConfirmButton: false
              });
              return
            }else if(hijos.length==2 && numero=="10"){
              Swal.fire({
                title: 'Error',
                text: 'No puedes colocar el barco aqui no hay espacio suficiente',
                icon: 'error',
                timer: 1000, 
                showConfirmButton: false
              });
              return
            }
            else{
              this.barco = [];
            this.barco.push(Idsuelto)
            let numeroint=parseInt(numero)
            for(let i=0; i<hijos.length-1; i++){
              numeroint+=1
              let posicion=letra+numeroint
              console.log(posicion)
              this.barco.push(posicion)
            }
            let terminar=false
            if(this.barcos.length>=1){
              console.log("ENTREEEEE")
              this.barcos.forEach(barcoposiciones => {
                console.log("ENTRREEEEEEE")
                barcoposiciones.forEach(posicion => {
                  console.log("ENTRRREEEEEE")
                  if(this.barco.includes(posicion)){
                    console.log("ENTRRRRRREEEEEEEEE")
                    terminar=true
                  }
                });
              });
              console.log(terminar)
              if(!terminar){
                this.barcos.push(this.barco)
                for(let i=0; i<hijos.length; i++){
                  let posicion=document.getElementById(this.barco[i])
                  posicion.style.background='grey'
                }
                this.quitar=true
              }else{ 
                Swal.fire({
                  title: 'Error',
                  text: 'Has puesto el barco en una posicion donde ya ahi un barco ponlo en otro lado',
                  icon: 'error',
                  timer: 1000, 
                  showConfirmButton: false
                });
              }
            }else{
              this.barcos.push(this.barco)
              for(let i=0; i<hijos.length; i++){
                let posicion=document.getElementById(this.barco[i])
                posicion.style.background='grey'
              }
              this.quitar=true
            }
            console.log(this.quitar)
            console.log("Mi lista de barcos: ",this.barcos)
            }
            
          }
          if(this.ancho>54 && this.ancho<=108){
            console.log("Pongo la posicion dos")
            console.log("Esta seria mi letra"+Idsuelto[0])
            const letra=Idsuelto[0]
            if(Idsuelto.length<3){
              numero=Idsuelto[1]
            }else{
              numero=Idsuelto[1]+Idsuelto[2]
            }
            if(hijos.length==4 && (numero=="1"||numero=="10"||numero=="9")){
              Swal.fire({
                title: 'Error',
                text: 'No puedes colocar el barco aqui no hay espacio suficiente',
                icon: 'error',
                timer: 1000, 
                showConfirmButton: false
              });
              return
            }else if(hijos.length==3 && (numero=="1"||numero=="10")){
              Swal.fire({
                title: 'Error',
                text: 'No puedes colocar el barco aqui no hay espacio suficiente',
                icon: 'error',
                timer: 1000, 
                showConfirmButton: false
              });
              return
            }else if(hijos.length==2 && numero=="1"){
              Swal.fire({
                title: 'Error',
                text: 'No puedes colocar el barco aqui no hay espacio suficiente',
                icon: 'error',
                timer: 1000, 
                showConfirmButton: false
              });
              return
            }else{
              this.barco = [];
            let numeroint=parseInt(numero)
            this.barco.push(letra+(numeroint-1))
            this.barco.push(Idsuelto)
            if(hijos.length>=4){
              for(let i=0; i<2; i++){
                numeroint+=1
                console.log(letra)
                let posicion=letra+numeroint
                console.log(posicion)
                this.barco.push(posicion)
              }
            }else{
              this.barco.push(letra+(numeroint+1))
            }
            console.log("Mi barco es: "+this.barco)
            let terminar=false
            if(this.barcos.length>=1){
              console.log("ENTREEEEE")
              this.barcos.forEach(barcoposiciones => {
                console.log("ENTRREEEEEEE")
                barcoposiciones.forEach(posicion => {
                  console.log("ENTRRREEEEEE")
                  if(this.barco.includes(posicion)){
                    console.log("ENTRRRRRREEEEEEEEE")
                    terminar=true
                  }
                });
              });
              console.log(terminar)
              if(!terminar){
                this.barcos.push(this.barco)
                for(let i=0; i<hijos.length; i++){
                  let posicion=document.getElementById(this.barco[i])
                  posicion.style.background='grey'
                }
                this.quitar=true
              }else{
                Swal.fire({
                  title: 'Error',
                  text: 'Has puesto el barco en una posicion donde ya ahi un barco ponlo en otro lado',
                  icon: 'error',
                  timer: 1000, 
                  showConfirmButton: false
                });
              }
            }else{
              this.barcos.push(this.barco)
              for(let i=0; i<hijos.length; i++){
                let posicion=document.getElementById(this.barco[i])
                posicion.style.background='grey'
              }
              this.quitar=true
            }
            console.log(this.quitar)
            console.log("Mi lista de barcos: "+this.barcos)
            }
            
          }
          if(this.ancho>108 && this.ancho<=162){
            console.log("Pongo la posicion tres")
            let posicionesanteriores=[]
            console.log("Esta seria mi letra"+Idsuelto[0])
            const letra=Idsuelto[0]
            if(Idsuelto.length<3){
              numero=Idsuelto[1]
            }else{
              numero=Idsuelto[1]+Idsuelto[2]
            }
            if(hijos.length==4 && (numero=="1"||numero=="2"||numero=="10")){
              Swal.fire({
                title: 'Error',
                text: 'No puedes colocar el barco aqui no hay espacio suficiente',
                icon: 'error',
                timer: 1000, 
                showConfirmButton: false
              });
              return
            }else if(hijos.length==3 && (numero=="1"||numero=="2")){
              Swal.fire({
                title: 'Error',
                text: 'No puedes colocar el barco aqui no hay espacio suficiente',
                icon: 'error',
                timer: 1000, 
                showConfirmButton: false
              });
              return
            }else{
              this.barco = [];
            /*let indice=this.letras.indexOf(letra)
            let indicesecundario=this.letras.indexOf(letra)*/
            let numeroint=parseInt(numero)
            for(let i=0; i<2; i++){
              numeroint-=1
              console.log(letra)
              let posicion=letra+numeroint
              console.log(posicion)
              posicionesanteriores.push(posicion)
            }
            posicionesanteriores=posicionesanteriores.reverse()
            for(let i=0; i<2; i++){
              this.barco.push(posicionesanteriores[i])
            }
            numeroint=parseInt(numero)
            this.barco.push(Idsuelto)
            if(hijos.length>=4){
              this.barco.push(letra+(numeroint+1))
            }
            console.log("Mi barco es: "+this.barco)
            let terminar=false
            if(this.barcos.length>=1){
              console.log("ENTREEEEE")
              this.barcos.forEach(barcoposiciones => {
                console.log("ENTRREEEEEEE")
                barcoposiciones.forEach(posicion => {
                  console.log("ENTRRREEEEEE")
                  if(this.barco.includes(posicion)){
                    console.log("ENTRRRRRREEEEEEEEE")
                    terminar=true
                  }
                });
              });
              console.log(terminar)
              if(!terminar){
                this.barcos.push(this.barco)
                for(let i=0; i<hijos.length; i++){
                  let posicion=document.getElementById(this.barco[i])
                  posicion.style.background='grey'
                }
                this.quitar=true
              }else{
                Swal.fire({
                  title: 'Error',
                  text: 'Has puesto el barco en una posicion donde ya ahi un barco ponlo en otro lado',
                  icon: 'error',
                  timer: 1000, 
                  showConfirmButton: false
                });
              }
            }else{
              this.barcos.push(this.barco)
              for(let i=0; i<hijos.length; i++){
                let posicion=document.getElementById(this.barco[i])
                posicion.style.background='grey'
              }
              this.quitar=true
            }
            console.log(this.quitar)
            console.log("Mi lista de barcos: "+this.barcos)
            }
            
          }
          if(this.ancho>162 && this.ancho<=220){
            console.log("pongo la posicion cuatro")
            let posicionesanteriores=[]
            console.log("Esta seria mi letra"+Idsuelto[0])
            const letra=Idsuelto[0]
            if(Idsuelto.length<3){
              numero=Idsuelto[1]
            }else{
              numero=Idsuelto[1]+Idsuelto[2]
            }
            if(numero=="1"||numero=="2"||numero=="3"){
              Swal.fire({
                title: 'Error',
                text: 'No puedes colocar el barco aqui no hay espacio suficiente',
                icon: 'error',
                timer: 1000, 
                showConfirmButton: false
              });
              return
            }else{
              this.barco = [];
            let numeroint=parseInt(numero)
            for(let i=0; i<3; i++){
              numeroint-=1
              console.log(letra)
              let posicion=letra+numeroint
              console.log(posicion)
              posicionesanteriores.push(posicion)
            }
            posicionesanteriores=posicionesanteriores.reverse()
            for(let i=0; i<3; i++){
              this.barco.push(posicionesanteriores[i])
            }
            this.barco.push(Idsuelto)
            let terminar=false
            if(this.barcos.length>=1){
              console.log("ENTREEEEE")
              this.barcos.forEach(barcoposiciones => {
                console.log("ENTRREEEEEEE")
                barcoposiciones.forEach(posicion => {
                  console.log("ENTRRREEEEEE")
                  if(this.barco.includes(posicion)){
                    console.log("ENTRRRRRREEEEEEEEE")
                    terminar=true
                  }
                });
              });
              console.log(terminar)
              if(!terminar){
                this.barcos.push(this.barco)
                for(let i=0; i<hijos.length; i++){
                  let posicion=document.getElementById(this.barco[i])
                  posicion.style.background='grey'
                }
                this.quitar=true
              }else{
                Swal.fire({
                  title: 'Error',
                  text: 'Has puesto el barco en una posicion donde ya ahi un barco ponlo en otro lado',
                  icon: 'error',
                  timer: 1000, 
                  showConfirmButton: false
                });
              }
            }else{
              this.barcos.push(this.barco)
              for(let i=0; i<hijos.length; i++){
                let posicion=document.getElementById(this.barco[i])
                posicion.style.background='grey'
              }
              this.quitar=true
            }
            console.log(this.quitar)
            console.log("Mi lista de barcos: "+this.barcos)
            }
          }
        }
        
        /*dropzone.append(item)*/
        if(this.quitar && (clase=="barco4-column"||clase=="barco4-row")){
          draggablebarco4.draggable=false
          draggablebarco4.style.display='none'
        }
        if(this.quitar && (clase=="barco3-column"||clase=="barco3-row")){
          draggablebarco3.draggable=false
          draggablebarco3.style.display='none'
        }
        if(this.quitar && (clase=="barco32-column"||clase=="barco32-row")){
          draggablebarco32.draggable=false
          draggablebarco32.style.display='none'
        }
        if(this.quitar && (clase=="barco2-column"||clase=="barco2-row")){
          draggablebarco2.draggable=false
          draggablebarco2.style.display='none'
        }
      });
    });
    /*dropzone.addEventListener("dragover", (ev) => ev.preventDefault());
    dropzone.addEventListener("drop", (ev) => {
      const id = ev.dataTransfer.getData("text/plain");
      const item = document.querySelector("#" + id);
      dropzone.append(item);
    });*/
  }
  cambiarposicionbarco4(){
    var barco4=document.getElementById("barco4");
    if(barco4.classList.contains("barco4-column")){
      barco4.classList.remove("barco4-column")
      barco4.classList.add("barco4-row")
    }else{
      barco4.classList.remove("barco4-row")
      barco4.classList.add("barco4-column")
    }
  }
  cambiarposicionbarco3(){
    var barco3=document.getElementById("barco3");
    if(barco3.classList.contains("barco3-column")){
      barco3.classList.remove("barco3-column")
      barco3.classList.add("barco3-row")
    }else{
      barco3.classList.remove("barco3-row")
      barco3.classList.add("barco3-column")
    }
  }
  cambiarposicionbarco32(){
    var barco32=document.getElementById("barco32");
    if(barco32.classList.contains("barco32-column")){
      barco32.classList.remove("barco32-column")
      barco32.classList.add("barco32-row")
    }else{
      barco32.classList.remove("barco32-row")
      barco32.classList.add("barco32-column")
    }
  }
  cambiarposicionbarco2(){
    var barco2=document.getElementById("barco2");
  if(barco2.classList.contains("barco2-column")){
    barco2.classList.remove("barco2-column")
    barco2.classList.add("barco2-row")
  }else{
    barco2.classList.remove("barco2-row")
    barco2.classList.add("barco2-column")
  }
  }
}
