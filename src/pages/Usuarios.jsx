import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Trash2, Edit, X, Save } from "lucide-react";

export default function Usuarios() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ email: "", full_name: "", role: "user", username: "", password: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
    base44.auth.me().then(u => setCurrentUser(u));
  }, []);

  const loadUsers = async () => {
    const data = await base44.entities.User.list("-created_date", 100);
    setUsers(data);
    setLoading(false);
  };

  const filtered = users.filter(u =>
    !search ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (user = null) => {
    if (user) {
      setFormData({ email: user.email, full_name: user.full_name || "", role: user.role || "user", username: user.username || "", password: "" });
      setIsEditing(true);
    } else {
      setFormData({ email: "", full_name: "", role: "user", username: "", password: "" });
      setIsEditing(false);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ email: "", full_name: "", role: "user", username: "", password: "" });
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isEditing) {
        // Actualizar usuario
        const userToUpdate = users.find(u => u.email === formData.email);
        await base44.entities.User.update(userToUpdate.id, {
          full_name: formData.full_name,
          role: formData.role,
          username: formData.username,
          password: formData.password
        });
        setUsers(users.map(u => u.email === formData.email ? { ...u, full_name: formData.full_name, role: formData.role, username: formData.username, password: formData.password } : u));
      } else {
        // Crear usuario (invitarlo)
        await base44.users.inviteUser(formData.email, formData.role);
        // Actualizar el usuario con username y password
        const newUsers = await base44.entities.User.list("-created_date", 1);
        if (newUsers.length > 0) {
          await base44.entities.User.update(newUsers[0].id, {
            username: formData.username,
            password: formData.password
          });
        }
        // Recargar la lista
        await loadUsers();
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving user:", error);
    }
    setSaving(false);
  };

  const handleDelete = async (userId) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
      await base44.entities.User.delete(userId);
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-sm text-muted-foreground mt-1">Administra el acceso y permisos de los usuarios</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Usuario
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por email o nombre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No hay usuarios registrados
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Email", "Nombre", "Rol", "Fecha de Registro", "Acciones"].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{user.full_name || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${
                        user.role === "admin" ? "bg-red-50 text-red-700 border-red-200" : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}>
                        {user.role || "user"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {user.created_date ? new Date(user.created_date).toLocaleDateString("es-MX") : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(user)}
                          className="gap-1 text-xs"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {currentUser?.id !== user.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                            className="gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
              </h2>
              <button onClick={handleCloseModal} className="p-1 hover:bg-muted rounded">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  disabled={isEditing}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="name" className="text-xs">Nombre</Label>
                <Input
                  id="name"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="role" className="text-xs">Rol</Label>
                <Select value={formData.role} onValueChange={role => setFormData({ ...formData, role })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuario</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="medico">Médico</SelectItem>
                    <SelectItem value="validador">Validador</SelectItem>
                    <SelectItem value="coordinador">Coordinador</SelectItem>
                    <SelectItem value="encargado_preparacion">Encargado Preparación</SelectItem>
                    <SelectItem value="preparador">Preparador</SelectItem>
                    <SelectItem value="mesa_atencion">Mesa de Atención</SelectItem>
                    <SelectItem value="encargado_calidad">Encargado Calidad</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="username" className="text-xs">Nombre de Usuario</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-xs">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder={isEditing ? "Dejar en blanco para no cambiar" : ""}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving || !formData.email} className="flex-1 gap-2">
                <Save className="h-4 w-4" />
                {saving ? "Guardando..." : "Guardar"}
              </Button>
              <Button onClick={handleCloseModal} variant="outline" className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}