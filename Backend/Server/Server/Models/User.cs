﻿using Microsoft.EntityFrameworkCore;

namespace Server.Models
{
    [Index(nameof(Email), IsUnique = true)]
    public class User
    {
        public int Id { get; set; }

        public string NickName { get; set; }

        public string Email { get; set; }

        public string Password { get; set; }

        public string Avatar { get; set; }

        public string Role { get; set; }

        public string Status { get; set; }

        // Necesita un historial de partidas
    }
}
