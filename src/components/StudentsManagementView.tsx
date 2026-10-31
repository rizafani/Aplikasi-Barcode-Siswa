import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Plus, Filter, Edit3, Trash2, IdCard, 
  Phone, Mail, Check, X, QrCode
} from 'lucide-react';
import { Student } from '../types/attendance';

interface StudentsManagementViewProps {
  students: Student[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onOpenDetail: (student: Student) => void;
  onNavigateImport: () => void;
}

export const StudentsManagementView: React.FC<StudentsManagementViewProps> = ({
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onOpenDetail,
  onNavigateImport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');

  // Modal for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form states
  const [nisn, setNisn] = useState('');
  const [name, setName] = useState('');
  const [studentClass, setStudentClass] = useState('XII MIPA 1');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [email, setEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [address, setAddress] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Class list
  const classList = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => set.add(s.class));
    return Array.from(set).sort();
  }, [students]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedClass !== 'ALL' && s.class !== selectedClass) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return (
          s.name.toLowerCase().includes(query) ||
          s.nisn.includes(query) ||
          s.class.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [students, selectedClass, searchQuery]);

  const openAddModal = () => {
    setEditingStudent(null);
    setNisn('');
    setName('');
    setStudentClass(classList[0] || 'XII MIPA 1');
    setGender('L');
    setGuardianPhone('');
    setEmail('');
    setPhotoUrl('');
    setAddress('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setNisn(student.nisn);
    setName(student.name);
    setStudentClass(student.class);
    setGender(student.gender);
    setGuardianPhone(student.guardianPhone);
    setEmail(student.email || '');
    setPhotoUrl(student.photoUrl);
    setAddress(student.address || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanNisn = nisn.replace(/[^0-9]/g, '');
    if (!cleanNisn || cleanNisn.length < 8) {
      setFormError('NISN harus berupa 8 - 12 digit angka.');
      return;
    }

    if (!name.trim()) {
      setFormError('Nama lengkap siswa harus diisi.');
      return;
    }

    // Check duplicate NISN
    const duplicate = students.find((s) => s.nisn === cleanNisn && s.id !== editingStudent?.id);
    if (duplicate) {
      setFormError(`NISN ${cleanNisn} sudah digunakan oleh siswa ${duplicate.name}.`);
      return;
    }

    const defaultAvatar =
      gender === 'L'
        ? 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';

    if (editingStudent) {
      onUpdateStudent({
        ...editingStudent,
        nisn: cleanNisn,
        name: name.trim(),
        class: studentClass.trim(),
        gender,
        guardianPhone: guardianPhone.trim() || '-',
        email: email.trim() || undefined,
        photoUrl: photoUrl.trim() || defaultAvatar,
        address: address.trim() || undefined,
      });
    } else {
      onAddStudent({
        id: `std-${cleanNisn}-${Date.now()}`,
        nisn: cleanNisn,
        name: name.trim(),
        class: studentClass.trim(),
        gender,
        guardianPhone: guardianPhone.trim() || '-',
        email: email.trim() || undefined,
        photoUrl: photoUrl.trim() || defaultAvatar,
        address: address.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (student: Student) => {
    if (window.confirm(`Yakin ingin menghapus data siswa ${student.name} (NISN: ${student.nisn})?`)) {
      onDeleteStudent(student.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Database Siswa & Kartu Barcode
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data siswa yang terdaftar di sekolah dan cetak kartu pelajar dengan barcode NISN.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onNavigateImport}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <span>Import dari Excel</span>
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">Filter Kelas:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
          >
            <option value="ALL">Semua Kelas ({students.length} Siswa)</option>
            {classList.map((cls) => (
              <option key={cls} value={cls}>
                Kelas {cls}
              </option>
            ))}
          </select>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama, kelas, atau NISN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Grid of Student Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada data siswa ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau tambah siswa baru.</p>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-3">
                  <img
                    src={student.photoUrl}
                    alt={student.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80';
                    }}
                    className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100 shadow-xs"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {student.class}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                    </div>

                    <h3
                      onClick={() => onOpenDetail(student)}
                      className="font-bold text-sm text-slate-900 mt-1 hover:text-indigo-600 transition-colors cursor-pointer truncate"
                    >
                      {student.name}
                    </h3>

                    <div className="flex items-center gap-1 font-mono text-xs font-semibold text-slate-600 mt-0.5">
                      <QrCode className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{student.nisn}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 truncate">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Wali: {student.guardianPhone}</span>
                  </div>
                  {student.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{student.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Card Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => onOpenDetail(student)}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <IdCard className="w-3.5 h-3.5" />
                  <span>Riwayat & Kartu</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(student)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    title="Edit Data Siswa"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(student)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    title="Hapus Siswa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">
                {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NISN (Nomor Induk Siswa Nasional)*
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    placeholder="Contoh: 0072819201"
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelas / Rombel*
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: XII MIPA 1"
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Siswa*
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama sesuai akta kelahiran..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. HP / WhatsApp Wali
                  </label>
                  <input
                    type="tel"
                    placeholder="08123456789"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Foto Profil Siswa (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://... atau biarkan kosong untuk foto default"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Siswa (Opsional)
                </label>
                <input
                  type="email"
                  placeholder="siswa@sekolah.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Rumah (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Jl. Raya No..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  {editingStudent ? 'Simpan Perubahan' : 'Simpan Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
