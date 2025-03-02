import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { WebsocketService } from '../../services/websocket.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { UserReceived } from '../../models/UserReceived';
import { AuthserviceService } from '../../services/authservice.service';
import { jwtDecode } from 'jwt-decode';
import { User } from '../../models/user';
import { DataService } from '../../services/data.service';
import { FriendRequest } from '../../models/FriendRequest';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';
import { FullUserReceived } from '../../models/FullUserReceived';
import { Request } from '../../models/Request';
import { Friend } from '../../models/Friend';
import { RequestService } from '../../services/request.service';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  constructor(private authService:AuthserviceService,private router:Router,private webSocketService:WebsocketService,private activatedRoute: ActivatedRoute, private dataService: DataService,private apiService:ApiService,private requestService:RequestService){
    if(localStorage.getItem("token")){
            this.decoded=jwtDecode(localStorage.getItem("token"));
          }else if(sessionStorage.getItem("token")){
            this.decoded=jwtDecode(sessionStorage.getItem("token"));
          }else{
            router.navigateByUrl("login")
            this.decoded=null
          }
          console.log("HOLAA ESTE ES MI CONSTRUCTOR")
          this.getUser()
          
  }

  decoded:User
  routeParamMap$: Subscription | null = null;
  user:FullUserReceived | null = null;
  messageReceived$:Subscription;
  isMyProfile:boolean = false;
  newImage:File | null = null;
  activateButtonFriend:boolean=false;
  activateButtonRequest:boolean=false;
  disconnected$: Subscription;
  isConnected: boolean = false;
  userId:number;
  maximumPage:number;
  pageSize:number = 5
  actualPage:number = 1

  ngOnInit(): void {
    console.log(this.decoded.nickName)
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
      if(message.message=="Cambiado el nombre con exito"){
        console.log("Nombre cambiado con exito")
        this.user.nickName=message.nickName
      }
      if(message.message=="No te puedes poner ese nombre"){
        console.log("Nombre no valido")
        Swal.fire({
          title: 'Apodo no disponible',
          icon: 'error',
          timer: 1000, 
          showConfirmButton: false
        });
      }
      if(message.message=="Cambiado el email con exito"){
        this.user.email=message.nickName
      }
      if(message.message=="No te puedes poner ese email"){
        Swal.fire({
          title: 'Email no disponible',
          icon: 'error',
          timer: 1000, 
          showConfirmButton: false
        });
      }
      if(message.message=="Añadido a lista de amigos"){
        console.log("nuevo amigo")
        if(message.id==this.user.id){
          this.activateButtonFriend=true;
        }
      }
      if(message.message=="Has sido eliminado de amigos"){
        console.log("Te eliminaron")
        if(message.nickName==this.user.nickName){
          console.log("Entre")
          this.activateButtonFriend=false;
          this.activateButtonRequest=false;
        }
      }
      if(message.message=="Has recibido una solicitud de amistad"){
        console.log("amistad")
        if(message.id==this.user.id){
          this.activateButtonRequest=true;
        }
      }
      if(message.message=="Se envió correctamente la solicitud"){
        this.activateButtonRequest=true;
      }
      if(message.message=="Has recibido una solicitud de partida"){
              console.log("Solicitud de partida de "+message.nickName)
              const playRequest = await Swal.fire({
                              title: "Solicitud de partida",
                              text: message.nickName+" te a invitado a jugar",
                              icon: "info",
                              showCancelButton: true,
                              confirmButtonText: "Aceptar",
                              cancelButtonText: "Cerrar"
                            });
                            if (playRequest.isConfirmed) {
                              Swal.fire("Aceptada", "Entrando a partida", "success");
                              this.router.navigate(['/matchmaking']);
                              const messageToSend:FriendRequest={TypeMessage:"Aceptar Partida",Identifier:message.nickName}
                              const jsonData = JSON.stringify(messageToSend)
                              console.log(jsonData)
                              this.webSocketService.sendRxjs(jsonData)
                            } else {
                              const messageToSend:FriendRequest={TypeMessage:"Rechazar Partida",Identifier:message.nickName}
                              const jsonData = JSON.stringify(messageToSend)
                              console.log(jsonData)
                              this.webSocketService.sendRxjs(jsonData)
                            }
            }
      if(message.message=="Has sido baneado"){
        this.apiService.deleteToken();
        this.webSocketService.disconnectRxjs();
        this.router.navigateByUrl("/login");
      }
    });
    this.disconnected$ = this.webSocketService.disconnected.subscribe(() => this.isConnected = false);
  }

  async getUser() {
    this.routeParamMap$ = this.activatedRoute.paramMap.subscribe(async paramMap => {
      const id = paramMap.get('id') as unknown as number;
      this.userId=id
      if(this.decoded.id != id){
        this.isMyProfile=false
      }else{
        console.log("Mi perfil")
        this.isMyProfile=true
      }
      const result = await this.authService.getFullUserById(id,{ActualPage:this.actualPage,GamePageSize:this.pageSize})
      if (result != null) {
        console.log("entro")
        this.user = result
        this.maximumPage = Math.ceil(this.user.totalGames / this.pageSize);
        console.log(this.user)
        console.log("Usuario: ", this.user)
        if(!this.isMyProfile){
          console.log("HE ENTRADO")
          this.recievFriend()
          this.reciveData()
          this.sendRequest()
        }
      }
      else{
        console.log("no entro")
      }
      
    });
  }

  backToMenu(){
    this.router.navigateByUrl("menu")
  }

  async changeNumberOfGames(){
    const pagesSelect = document.getElementById("games-per-page") as HTMLInputElement | HTMLSelectElement;
    if(pagesSelect){
      this.pageSize = parseInt(pagesSelect.value)
      this.actualPage = 1

      const result = await this.authService.getFullUserById(this.userId,{ActualPage:this.actualPage,GamePageSize:this.pageSize})
      if (result != null) {
        this.user = result

        this.maximumPage = Math.ceil(this.user.totalGames / this.pageSize);
        // disabled botones prev y first
        const firstBtn = document.getElementById("firstBtn") as HTMLButtonElement
        const prevBtn = document.getElementById("prevBtn") as HTMLButtonElement
        firstBtn.disabled = true
        prevBtn.disabled = true
        if(this.actualPage < this.maximumPage){
          // disabled botones next y last
          const nextBtn = document.getElementById("nextBtn") as HTMLButtonElement
          const lastBtn = document.getElementById("lastBtn") as HTMLButtonElement
          nextBtn.disabled = true
          lastBtn.disabled = true
        }
      }
      else{
        console.log("fallo al cargar usuario")
      }
    }
  }

  async firstPage(){
    if(this.actualPage > 1){
      this.actualPage = 1
      // Hacer disabled los botones prev y frist
      const firstBtn = document.getElementById("firstBtn") as HTMLButtonElement
      const prevBtn = document.getElementById("prevBtn") as HTMLButtonElement
      firstBtn.disabled = true
      prevBtn.disabled =true
      if(this.actualPage < this.maximumPage){
        // hacer enabled los botones next y last
        const nextBtn = document.getElementById("nextBtn") as HTMLButtonElement
        const lastBtn = document.getElementById("lastBtn") as HTMLButtonElement
        nextBtn.disabled = false
        lastBtn.disabled = false
      }
      const result = await this.authService.getFullUserById(this.userId,{ActualPage:this.actualPage,GamePageSize:this.pageSize})
      if (result != null) {
        this.user = result
      }
      else{
        console.log("fallo al cargar usuario")
      }
    }
  }

  async prevPage(){
    if(this.actualPage > 1){
      this.actualPage = this.actualPage - 1
      if (this.actualPage == 1) {
        // hacer disabled los botones prev y first
        const firstBtn = document.getElementById("firstBtn") as HTMLButtonElement
        const prevBtn = document.getElementById("prevBtn") as HTMLButtonElement
        firstBtn.disabled = true
        prevBtn.disabled = true
      }
      if(this.actualPage < this.maximumPage){
        // hacer enabled los botones next y last
        const nextBtn = document.getElementById("nextBtn") as HTMLButtonElement
        const lastBtn = document.getElementById("lastBtn") as HTMLButtonElement
        nextBtn.disabled = false
        lastBtn.disabled = false
      }
      const result = await this.authService.getFullUserById(this.userId,{ActualPage:this.actualPage,GamePageSize:this.pageSize})
      if (result != null) {
        this.user = result
      }
      else{
        console.log("fallo al cargar usuario")
      }
    }
  }

  async nextPage(){
    if(this.actualPage < this.maximumPage){
      this.actualPage = this.actualPage + 1
      // enabled botones prev y first
      const firstBtn = document.getElementById("firstBtn") as HTMLButtonElement
      const prevBtn = document.getElementById("prevBtn") as HTMLButtonElement
      firstBtn.disabled = false
      prevBtn.disabled = false
      if(this.actualPage == this.maximumPage){
        // disabled botones next y last
        const nextBtn = document.getElementById("nextBtn") as HTMLButtonElement
        const lastBtn = document.getElementById("lastBtn") as HTMLButtonElement
        nextBtn.disabled = true
        lastBtn.disabled = true
      }
      const result = await this.authService.getFullUserById(this.userId,{ActualPage:this.actualPage,GamePageSize:this.pageSize})
      if (result != null) {
        this.user = result
      }
      else{
        console.log("fallo al cargar usuario")
      }
    }
  }

  async lastPage(){
    if(this.actualPage < this.maximumPage){
      this.actualPage = this.maximumPage
      // enable botones prev y first
      const firstBtn = document.getElementById("firstBtn") as HTMLButtonElement
      const prevBtn = document.getElementById("prevBtn") as HTMLButtonElement
      firstBtn.disabled = false
      prevBtn.disabled = false
      // disabled botones next y last
      const nextBtn = document.getElementById("nextBtn") as HTMLButtonElement
      const lastBtn = document.getElementById("lastBtn") as HTMLButtonElement
      nextBtn.disabled = true
      lastBtn.disabled = true

      const result = await this.authService.getFullUserById(this.userId,{ActualPage:this.actualPage,GamePageSize:this.pageSize})
      if (result != null) {
        this.user = result
      }
      else{
        console.log("fallo al cargar usuario")
      }
    }
  }

  requestUser(nickName){
    if (nickName != "") {
      const User:FriendRequest={TypeMessage:"amistad" ,Identifier: nickName,Identifier2:null}
      // Convertir el objeto a JSON
      const jsonData = JSON.stringify(User);
      console.log(JSON.stringify(User));
      this.webSocketService.sendRxjs(jsonData);
    }
  }

  async deleteUser(nickName){
      const wantToDelete = await Swal.fire({
        title: "¿Estás seguro?",
        text: "Esta acción no se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Eliminar",
        cancelButtonText: "Cancelar"
      });
      if (wantToDelete.isConfirmed) {
        Swal.fire("Confirmado", nickName+" ya no es tu amigo", "success");
        this.activateButtonFriend=false;
        this.activateButtonRequest=false
        const message:FriendRequest={TypeMessage:"eliminar",Identifier:nickName}
        const jsonData = JSON.stringify(message)
        console.log(jsonData)
        this.webSocketService.sendRxjs(jsonData)
      } else {
        Swal.fire("Cancelado", "La acción fue cancelada", "error");
      }
    }

  changeNickName(){
    Swal.fire({
      title: 'Cambiar nombre',
      input: 'text',
      inputPlaceholder: 'Ingresa tu nuevo apodo',
      showCancelButton: true,
      confirmButtonText: 'Cambiar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const nickName = result.value;
        const messageToSend = { TypeMessage: "Solicitud cambio de nombre", Identifier: nickName };
        const jsonData = JSON.stringify(messageToSend);
        console.log(jsonData);
        this.webSocketService.sendRxjs(jsonData);
      } else {
        console.log("No se cambió el nombre");
      }
    });
  }

  changeEmail(){
    Swal.fire({
      title: 'Cambiar email',
      input: 'email',
      inputPlaceholder: 'Ingresa tu nuevo email',
      showCancelButton: true,
      confirmButtonText: 'Cambiar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const email = result.value;
        const messageToSend = { TypeMessage: "Solicitud cambio de email", Identifier: email };
        const jsonData = JSON.stringify(messageToSend);
        console.log(jsonData);
        this.webSocketService.sendRxjs(jsonData);
      } else {
        console.log("No se cambió el email");
      }
    });

  }

  changeOrTakeOffImage(){
    Swal.fire({
      title: 'Editar avatar',
      html: `
        <input type="file" id="avatarInput" accept="image/png, image/jpeg, image/jpg" class="swal2-input">
        <button id="changeImageButton" class="swal2-confirm swal2-styled">Cambiar imagen</button>
        <button id="removeImageButton" class="swal2-cancel swal2-styled">Quitar imagen</button>
      `,
      showCancelButton: false,
      showConfirmButton: false,
      didOpen: () => {
        const fileInput = document.getElementById('avatarInput') as HTMLInputElement;
        const changeBtn = document.getElementById('changeImageButton') as HTMLButtonElement;
        const removeBtn = document.getElementById('removeImageButton') as HTMLButtonElement;

        fileInput.addEventListener('change', (event: Event) => {
          this.onFileSelected(event);
        });

        changeBtn.addEventListener('click', () => {
          this.changeImage();
          Swal.close();
        });

        removeBtn.addEventListener('click', () => {
          this.takeOffImage();
          Swal.close();
        });
      }
    });
  }

  onFileSelected(event: any){
    const image = event.target.files[0] as File;
    if(image){
      console.log(image)
      this.newImage=image;
    }else{
      console.log("No hay imagen")
    }
  }

  async changeImage(){
    const result = await this.authService.changeImageservice(this.newImage)
    this.user.avatar=environment.images+result.data.image
  }

  async takeOffImage(){
    this.newImage==null
    const result = await this.authService.changeImageservice(this.newImage)
    this.user.avatar=environment.images+result.data.image
  }



  async changePassword(){
    Swal.fire({
      title: 'Cambiar contraseña',
      html:
        '<input type="password" id="password" class="swal2-input" placeholder="Nueva contraseña">' +
        '<input type="password" id="repeat-password" class="swal2-input" placeholder="Repite la contraseña">',
      showCancelButton: true,
      confirmButtonText: 'Cambiar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const password = (document.getElementById('password') as HTMLInputElement).value;
        const repeatPassword = (document.getElementById('repeat-password') as HTMLInputElement).value;
        
        if (!password || !repeatPassword) {
          Swal.showValidationMessage('No dejes los campos vacíos');
          return false;
        }
        if (password !== repeatPassword) {
          Swal.showValidationMessage('Las contraseñas no coinciden');
          return false;
        }
        return password;
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const password = result.value;
        const response = await this.authService.changepassword(password);
        if (response.success) {
          this.apiService.deleteToken();
          this.webSocketService.disconnectRxjs();
          this.router.navigateByUrl("login");
        }
      }
    });
  }
  async reciveData(){
    var result = await this.requestService.receiveRequests()
    console.log("peticiones recibidas",result.data)
    result.data.forEach(request => {
      if(request.id==this.user.id){
        console.log("FUNCIONEEEEEEE")
        this.activateButtonRequest=true;
      }
    });
  }

  async recievFriend(){
    var result = await this.requestService.receiveFriend()
    console.log("Mis amigos",result.data)
    result.data.forEach(friend => {
      if(friend.id==this.user.id){
        console.log("FUNCIONEEEEEEE")
        this.activateButtonFriend=true;
      }
    });
  }

  async sendRequest(){
    var result = await this.requestService.sendRequest()
    console.log("Peticiones de amistad enviadas",result.data)
    result.data.forEach(request => {
      if(request.id==this.user.id){
        console.log("FUNCIONEEEEEEE")
        this.activateButtonRequest=true;
      }
    });
  }
  ngOnDestroy(): void {
    this.messageReceived$.unsubscribe();
    this.disconnected$.unsubscribe();
  }
}
