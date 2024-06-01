import { firestore } from './firebase'; // Adjust the path as necessary

export const getAppointments = async (filter, lastVisible, pageSize, searchText) => {
  let query = firestore.collection('appointments')
    .where('appointmentStatus', '==', filter)
    .orderBy('createdDate', 'desc')
    .limit(pageSize);

  if (lastVisible) {
    query = query.startAfter(lastVisible);
  }

  if (searchText) {
    query = query.where('fullName', '>=', searchText).where('fullName', '<=', searchText + '\uf8ff');
  }

  const snapshot = await query.get();
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const lastDoc = snapshot.docs[snapshot.docs.length - 1];
  return { data, lastVisible: lastDoc };
};
