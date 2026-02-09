import { useEffect, useState } from "react";
import api from "../api/apiClient";
import MemberLayout from "../../components/MemberLayout";

export default function MemberProfile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await api.get("me/");
      setProfile(res.data);
    })();
  }, []);

  if (!profile) return <MemberLayout title="Loading..." />;

  return (
    <MemberLayout title="Member Profile">
      <p>Name: {profile.name}</p>
      <p>Member ID: {profile.member_id}</p>
      <p>Track: {profile.track}</p>
    </MemberLayout>
  );
}
