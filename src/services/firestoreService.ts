import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Student, AttendanceRecord, SchoolSettings } from '../types/attendance';
import { INITIAL_STUDENTS, generateInitialAttendance, DEFAULT_SETTINGS } from '../data/initialData';

const STUDENTS_COL = 'students';
const ATTENDANCE_COL = 'attendance';
const SETTINGS_COL = 'settings';
const SETTINGS_DOC_ID = 'config';

export const firestoreService = {
  // Subscribe to students with auto-seeding if empty
  subscribeStudents(callback: (students: Student[]) => void, onError?: (err: unknown) => void) {
    const colRef = collection(db, STUDENTS_COL);

    return onSnapshot(
      colRef,
      async (snapshot) => {
        if (snapshot.empty) {
          // Seed initial students into Firestore
          try {
            const batch = writeBatch(db);
            INITIAL_STUDENTS.forEach((student) => {
              const docRef = doc(db, STUDENTS_COL, student.id);
              batch.set(docRef, student);
            });
            await batch.commit();
          } catch (seedError) {
            handleFirestoreError(seedError, OperationType.WRITE, STUDENTS_COL);
          }
          return;
        }

        const students: Student[] = [];
        snapshot.forEach((d) => {
          students.push(d.data() as Student);
        });
        callback(students);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.LIST, STUDENTS_COL);
      }
    );
  },

  // Subscribe to attendance records with auto-seeding if empty
  subscribeAttendance(callback: (records: AttendanceRecord[]) => void, onError?: (err: unknown) => void) {
    const colRef = collection(db, ATTENDANCE_COL);

    return onSnapshot(
      colRef,
      async (snapshot) => {
        if (snapshot.empty) {
          try {
            const initialRecords = generateInitialAttendance();
            const batch = writeBatch(db);
            initialRecords.forEach((record) => {
              const docRef = doc(db, ATTENDANCE_COL, record.id);
              batch.set(docRef, record);
            });
            await batch.commit();
          } catch (seedError) {
            handleFirestoreError(seedError, OperationType.WRITE, ATTENDANCE_COL);
          }
          return;
        }

        const records: AttendanceRecord[] = [];
        snapshot.forEach((d) => {
          records.push(d.data() as AttendanceRecord);
        });
        callback(records);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.LIST, ATTENDANCE_COL);
      }
    );
  },

  // Subscribe to school settings
  subscribeSettings(callback: (settings: SchoolSettings) => void, onError?: (err: unknown) => void) {
    const docRef = doc(db, SETTINGS_COL, SETTINGS_DOC_ID);

    return onSnapshot(
      docRef,
      async (snapshot) => {
        if (!snapshot.exists()) {
          try {
            await setDoc(docRef, DEFAULT_SETTINGS);
          } catch (seedError) {
            handleFirestoreError(seedError, OperationType.WRITE, `${SETTINGS_COL}/${SETTINGS_DOC_ID}`);
          }
          return;
        }

        callback({ ...DEFAULT_SETTINGS, ...(snapshot.data() as SchoolSettings) });
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, `${SETTINGS_COL}/${SETTINGS_DOC_ID}`);
      }
    );
  },

  // Student CRUD
  async saveStudent(student: Student) {
    const path = `${STUDENTS_COL}/${student.id}`;
    try {
      await setDoc(doc(db, STUDENTS_COL, student.id), student);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteStudent(studentId: string) {
    const path = `${STUDENTS_COL}/${studentId}`;
    try {
      await deleteDoc(doc(db, STUDENTS_COL, studentId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Attendance Record CRUD
  async saveAttendanceRecord(record: AttendanceRecord) {
    const path = `${ATTENDANCE_COL}/${record.id}`;
    try {
      await setDoc(doc(db, ATTENDANCE_COL, record.id), record);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // School Settings Update
  async saveSettings(settings: SchoolSettings) {
    const path = `${SETTINGS_COL}/${SETTINGS_DOC_ID}`;
    try {
      await setDoc(doc(db, SETTINGS_COL, SETTINGS_DOC_ID), settings);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Batch import
  async batchImportStudents(newStudents: Student[], mode: 'merge' | 'replace') {
    try {
      if (mode === 'replace') {
        // Delete existing students
        const snapshot = await getDocs(collection(db, STUDENTS_COL));
        const deleteBatch = writeBatch(db);
        snapshot.forEach((d) => {
          deleteBatch.delete(d.ref);
        });
        await deleteBatch.commit();
      }

      // Add new students in batches
      const chunks: Student[][] = [];
      for (let i = 0; i < newStudents.length; i += 400) {
        chunks.push(newStudents.slice(i, i + 400));
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach((st) => {
          const docRef = doc(db, STUDENTS_COL, st.id);
          batch.set(docRef, st);
        });
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, STUDENTS_COL);
    }
  },

  // Reset database to initial defaults
  async resetToDefaults() {
    try {
      // Clear students
      const stdSnapshot = await getDocs(collection(db, STUDENTS_COL));
      const b1 = writeBatch(db);
      stdSnapshot.forEach((d) => b1.delete(d.ref));
      INITIAL_STUDENTS.forEach((st) => {
        b1.set(doc(db, STUDENTS_COL, st.id), st);
      });
      await b1.commit();

      // Clear attendance
      const attSnapshot = await getDocs(collection(db, ATTENDANCE_COL));
      const b2 = writeBatch(db);
      attSnapshot.forEach((d) => b2.delete(d.ref));
      const seeded = generateInitialAttendance();
      seeded.forEach((rec) => {
        b2.set(doc(db, ATTENDANCE_COL, rec.id), rec);
      });
      await b2.commit();

      // Reset settings
      await setDoc(doc(db, SETTINGS_COL, SETTINGS_DOC_ID), DEFAULT_SETTINGS);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'database_reset');
    }
  },
};
