import { useAuth } from '@/auth/AuthProvider';
import { AssistantDashboard } from '@/components/dashboards/AssistantDashboard';
import { CollaboratorDashboard } from '@/components/dashboards/CollaboratorDashboard';
import { FallbackDashboard } from '@/components/dashboards/FallbackDashboard';
import { OwnerDashboard } from '@/components/dashboards/OwnerDashboard';

/** Le tableau de bord change intégralement selon le rôle connecté (§10, §19). */
export default function DashboardScreen() {
  const { profile } = useAuth();
  if (!profile) return null;

  switch (profile.role) {
    case 'assistant':
      return <AssistantDashboard />;
    case 'collaborator_dentist':
      return <CollaboratorDashboard />;
    case 'owner_dentist':
    case 'super_admin':
      return <OwnerDashboard />;
    default:
      return <FallbackDashboard />;
  }
}
