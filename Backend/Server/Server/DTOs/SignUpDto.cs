﻿namespace Server.DTOs
{
    public class SignUpDto
    {
        public string NickName { get; set; }

        public string Email { get; set; }

        public string Password { get; set; }

        public IFormFile Avatar { get; set; }
    }
}
