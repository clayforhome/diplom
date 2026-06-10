import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { MeetingForm } from '../../components/meetings/MeetingForm/MeetingForm';
import { ParticipantsPanel } from '../../components/meetings/ParticipantsPanel/ParticipantsPanel';
import { PageSection } from '../../components/layout/PageSection/PageSection';
import { Badge } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { Spinner } from '../../components/ui/Spinner/Spinner';
import { ApiError } from '../../http/httpClient';
import { sessionsService } from '../../http/sessionsService';
import { useToast } from '../../hooks/useToast';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchMeetingThunk, fetchParticipantsThunk } from '../../store/slices/sessionsSlice';
import type { MeetingFileItem, MeetingFormValues, MeetingStatus } from '../../types';
import { formatDate, formatDateTimeRange, toDateTimeString } from '../../utils/format';
import { getMeetingFormatLabel, getMeetingStatusLabel } from '../../utils/meetingLabels';

function getDisplayFileName(fileName: string): string {
  const trimmed = fileName.trim();
  const underscoreIndex = trimmed.indexOf('_');

  if (underscoreIndex > 0) {
    const prefix = trimmed.slice(0, underscoreIndex);
    if (/^[0-9a-f-]{36}$/i.test(prefix)) {
      return trimmed.slice(underscoreIndex + 1);
    }
  }

  return trimmed;
}

function getFormValues(meeting?: {
  title?: string;
  description?: string | null;
  date?: string;
  startTime?: string;
  endTime?: string;
  format?: 'Offline' | 'Online' | 'Hybrid' | 'Phone';
  status?: MeetingStatus;
  location?: string | null;
  meetingLink?: string | null;
  contactInfo?: string | null;
}): MeetingFormValues {
  function toLocalDateString(iso: string): string {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function toLocalTimeString(iso: string): string {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  return {
    title: meeting?.title ?? '',
    description: meeting?.description ?? '',
    date: meeting?.date ? toLocalDateString(meeting.date) : '',
    startTime: meeting?.startTime ? toLocalTimeString(meeting.startTime) : '',
    endTime: meeting?.endTime ? toLocalTimeString(meeting.endTime) : '',
    format: meeting?.format ?? 'Offline',
    status: meeting?.status,
    location: meeting?.location ?? '',
    meetingLink: meeting?.meetingLink ?? '',
    contactInfo: meeting?.contactInfo ?? '',
    participantIds: []
  };
}

export function SessionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [meetingFiles, setMeetingFiles] = useState<MeetingFileItem[]>([]);
  const [isFilesLoading, setIsFilesLoading] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fileToRemove, setFileToRemove] = useState<{ id: string; name: string } | null>(null);
  const [isFileRemoving, setIsFileRemoving] = useState(false);
  const meeting = useAppSelector((state) => state.sessions.selectedMeeting);
  const participants = useAppSelector((state) => state.sessions.participants);
  const auth = useAppSelector((state) => state.auth);

  const formValues = useMemo(() => getFormValues(meeting ?? undefined), [meeting]);
  const canManage = Boolean(meeting && auth.user?.id === meeting.organizerId) || auth.roles.includes('Admin');

  async function loadMeetingFiles(meetingId: string) {
    setIsFilesLoading(true);
    try {
      const files = await sessionsService.listMeetingFiles(meetingId);
      setMeetingFiles(files);
    } catch {
      setMeetingFiles([]);
      toast(t('sessionDetail.filesLoadError'), 'error');
    } finally {
      setIsFilesLoading(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    void dispatch(fetchMeetingThunk(id));
    void dispatch(fetchParticipantsThunk(id));
    void loadMeetingFiles(id);
  }, [dispatch, id]);

  useEffect(() => {
    document.title = `${meeting?.title ?? t('sessionDetail.pageTitle')} - ${t('common.appName')}`;
  }, [meeting?.title, t, i18n.resolvedLanguage]);

  if (!id || !meeting) {
    return <Spinner />;
  }

  return (
    <PageSection title={meeting.title} subtitle={`${formatDate(meeting.date)} • ${formatDateTimeRange(meeting.startTime, meeting.endTime)}`}>
      <div className={`detail-grid ${canManage ? '' : 'detail-grid--viewer'}`.trim()}>
        <Card>
          <div className="detail-grid__summary">
            <div className="detail-grid__summary-head">
              <div className="detail-grid__badges">
                <Badge tone="info">{getMeetingFormatLabel(meeting.format)}</Badge>
                <Badge>{getMeetingStatusLabel(meeting.status)}</Badge>
              </div>
              <div className="detail-grid__stats">
                <div className="detail-grid__stat">
                  <strong>{meeting.participantCount}</strong>
                  <span>{t('sessionDetail.participantsCount')}</span>
                </div>
                <div className="detail-grid__stat">
                  <strong>{meeting.fileCount}</strong>
                  <span>{t('sessionDetail.filesCount')}</span>
                </div>
              </div>
            </div>
            <div className="detail-grid__description-card">
              <span className="detail-grid__label">{t('sessionDetail.description')}</span>
              <p>{meeting.description || t('sessionDetail.descriptionFallback')}</p>
            </div>
            <div className="detail-grid__facts">
              <div className="detail-grid__fact">
                <span className="detail-grid__label">{t('sessionDetail.location')}</span>
                <strong>{meeting.location || t('common.notSpecified')}</strong>
              </div>
              <div className="detail-grid__fact">
                <span className="detail-grid__label">{t('sessionDetail.meetingLink')}</span>
                <strong>{meeting.meetingLink || t('common.notSpecified')}</strong>
              </div>
              <div className="detail-grid__fact">
                <span className="detail-grid__label">{t('sessionDetail.contactInfo')}</span>
                <strong>{meeting.contactInfo || t('common.notSpecified')}</strong>
              </div>
              <div className="detail-grid__fact">
                <span className="detail-grid__label">{t('sessionDetail.dateTime')}</span>
                <strong>{`${formatDate(meeting.date)} • ${formatDateTimeRange(meeting.startTime, meeting.endTime)}`}</strong>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="meeting-files">
            <div className="meeting-files__header">
              <div>
                <span className="detail-grid__label">{t('sessionDetail.filesLabel')}</span>
                <h3 className="meeting-files__title">{t('sessionDetail.filesTitle')}</h3>
              </div>
              {canManage ? (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="meeting-files__input"
                    accept=".pdf,.docx,.pptx,.xlsx,.jpg,.jpeg,.png"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;

                      setIsUploadingFile(true);
                      try {
                        await sessionsService.uploadMeetingFile(id, file);
                        toast(t('sessionDetail.fileUploaded'), 'success');
                        await Promise.all([loadMeetingFiles(id), dispatch(fetchMeetingThunk(id)).unwrap()]);
                      } catch (error) {
                        toast(error instanceof ApiError ? error.message : t('sessionDetail.fileUploadError'), 'error');
                      } finally {
                        setIsUploadingFile(false);
                        event.target.value = '';
                      }
                    }}
                  />
                  <Button type="button" variant="secondary" disabled={isUploadingFile} onClick={() => fileInputRef.current?.click()}>
                    {isUploadingFile ? t('common.loading') : t('sessionDetail.fileUploadButton')}
                  </Button>
                </>
              ) : null}
            </div>

            {isFilesLoading ? <Spinner /> : null}
            {!isFilesLoading && meetingFiles.length === 0 ? <EmptyState title={t('sessionDetail.filesEmptyTitle')} description={t('sessionDetail.filesEmptyDescription')} /> : null}

            {!isFilesLoading && meetingFiles.length > 0 ? (
              <div className="meeting-files__list">
                {meetingFiles.map((file) => (
                  <div key={file.id} className="meeting-files__item">
                    <div className="meeting-files__item-copy">
                      <strong title={getDisplayFileName(file.fileName)}>{getDisplayFileName(file.fileName)}</strong>
                    </div>
                    <div className="meeting-files__actions">
                      <a className="button button--secondary" href={sessionsService.getMeetingFileDownloadUrl(id, file.id)} download={getDisplayFileName(file.fileName)}>
                        {t('common.download')}
                      </a>
                      {canManage ? (
                        <Button type="button" variant="danger" onClick={() => setFileToRemove({ id: file.id, name: getDisplayFileName(file.fileName) })}>
                          {t('common.delete')}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </Card>

        {canManage ? (
          <MeetingForm
            initialValues={formValues}
            isEditing
            footerActions={
              <Button type="button" variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                {t('sessionDetail.deleteMeeting')}
              </Button>
            }
            onSubmit={async (values) => {
              await sessionsService.updateMeeting(id, {
                title: values.title,
                description: values.description,
                date: `${values.date}T00:00:00.000Z`,
                startTime: toDateTimeString(values.date, values.startTime),
                endTime: toDateTimeString(values.date, values.endTime),
                format: values.format,
                status: values.status,
                location: values.location,
                meetingLink: values.meetingLink,
                contactInfo: values.contactInfo
              });
              toast(t('sessionDetail.meetingUpdated'), 'success');
              await dispatch(fetchMeetingThunk(id)).unwrap();
            }}
          />
        ) : null}

        <ParticipantsPanel
          participants={participants}
          canRespond={meeting.status !== 'Confirmed' && meeting.status !== 'Completed' && meeting.status !== 'Cancelled'}
          currentUserId={auth.user?.id}
          onRespond={async (status, comment) => {
            if (!auth.user?.id) return;
            await sessionsService.respondToInvitation(id, auth.user.id, { status, comment });
            toast(t('sessionDetail.responseSaved'), 'success');
            await dispatch(fetchParticipantsThunk(id)).unwrap();
          }}
          onInvite={
            canManage
              ? async (participantIds) => {
                  await sessionsService.inviteParticipants(id, { participantIds });
                  toast(t('sessionDetail.participantsInvited'), 'success');
                  await dispatch(fetchParticipantsThunk(id)).unwrap();
                  await dispatch(fetchMeetingThunk(id)).unwrap();
                }
              : undefined
          }
          onRemove={
            canManage
              ? async (userId) => {
                  await sessionsService.removeParticipant(id, userId);
                  toast(t('sessionDetail.participantRemoved'), 'success');
                  await dispatch(fetchParticipantsThunk(id)).unwrap();
                  await dispatch(fetchMeetingThunk(id)).unwrap();
                }
              : undefined
          }
        />
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={t('sessionDetail.deleteMeetingTitle')}
        description={t('sessionDetail.deleteMeetingDescription', { title: meeting.title })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        isConfirming={isDeleting}
        onConfirm={async () => {
          setIsDeleting(true);
          try {
            await sessionsService.deleteMeeting(id);
            toast(t('sessionDetail.meetingDeleted'), 'success');
            setShowDeleteConfirm(false);
            navigate('/sessions');
          } catch (error) {
            toast(error instanceof ApiError ? error.message : t('sessionDetail.meetingDeleteError'), 'error');
          } finally {
            setIsDeleting(false);
          }
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ConfirmDialog
        isOpen={Boolean(fileToRemove)}
        title={t('sessionDetail.deleteFileTitle')}
        description={t('sessionDetail.deleteFileDescription', { name: fileToRemove?.name ?? '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        isConfirming={isFileRemoving}
        onConfirm={async () => {
          if (!fileToRemove) return;
          setIsFileRemoving(true);
          try {
            await sessionsService.deleteMeetingFile(id, fileToRemove.id);
            toast(t('sessionDetail.fileDeleted'), 'success');
            setFileToRemove(null);
            await Promise.all([loadMeetingFiles(id), dispatch(fetchMeetingThunk(id)).unwrap()]);
          } catch (error) {
            toast(error instanceof ApiError ? error.message : t('sessionDetail.fileDeleteError'), 'error');
          } finally {
            setIsFileRemoving(false);
          }
        }}
        onCancel={() => setFileToRemove(null)}
      />
    </PageSection>
  );
}
