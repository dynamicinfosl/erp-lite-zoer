// import CrudOperations from '@/lib/crud-operations';
// import { generateAdminUserToken } from '@/lib/auth';

export async function userRegisterCallback(user: {
  id: string;
  email: string;
  role: string;
}): Promise<void> {
  try {
    console.log('Callback de registro chamado para usuário:', user.email);
    
    // Por enquanto, apenas logar o usuário registrado
    // A criação do perfil será feita posteriormente quando necessário
    console.log('Usuário registrado com sucesso:', {
      id: user.id,
      email: user.email,
      role: user.role
    });
    
    // TODO: Implementar criação de perfil quando o sistema estiver estável
    // const adminToken = await generateAdminUserToken();
    // const profilesCrud = new CrudOperations("user_profiles", adminToken);
    // const profileData = {
    //   user_id: user.id,
    //   name: user.email.split('@')[0],
    //   phone: null,
    //   role_type: 'vendedor',
    //   is_active: true,
    // };
    // await profilesCrud.create(profileData);
    
  } catch (error) {
    console.error('Erro no callback de registro:', error);
    // Não falhar o registro principal
  }
}
