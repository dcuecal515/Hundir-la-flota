import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent {
  constructor(private apiService:ApiService,private router:Router){}

  deleteToken(){
    this.apiService.deleteToken();
    this.router.navigateByUrl("login");
  }
}
