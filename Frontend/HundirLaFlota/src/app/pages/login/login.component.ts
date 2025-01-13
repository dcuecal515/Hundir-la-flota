import { Component,ViewChild,ElementRef } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  @ViewChild('login', { static: true }) login!: ElementRef;
  @ViewChild('signup', { static: false }) signup!: ElementRef;
  
  changesignup(){
    this.login.nativeElement.style.display='none'
    this.signup.nativeElement.style.display='flex'
  }
  changelogin(){
    this.signup.nativeElement.style.display='none'
    this.login.nativeElement.style.display='flex'
  }
}
