import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MeetingForm } from '../../components/meetings/MeetingForm/MeetingForm';
import { ParticipantsPanel } from '../../components/meetings/ParticipantsPanel/ParticipantsPanel';
import { Badge } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { PageSection } from '../../components/layout/PageSection/PageSection';
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

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(prefix)) {
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
  const date = meeting?.date ? new Date(meeting.date).toISOString().slice(0, 10) : '';
  const startTime = meeting?.startTime ? new Date(meeting.startTime).toISOString().slice(11, 16) : '';
  const endTime = meeting?.endTime ? new Date(meeting.endTime).toISOString().slice(11, 16) : '';

  return {
    title: meeting?.title ?? '',
    description: meeting?.description ?? '',
    date,
    startTime,
    endTime,
    format: meeting?.format ?? 'Offline',
    status: meeting?.status,
    location: meeting?.location ?? '',
    meetingLink: meeting?.meetingLink ?? '',
    contactInfo: meeting?.contactInfo ?? '',
    participantIds: []
  };
}

function getFileMeta(file: MeetingFileItem): string {
  const parts = [formatDate(file.uploadedAt)];

  if (file.uploaderName?.trim()) {
    parts.push(file.uploaderName);
  }

  if (file.fileType.trim()) {
    parts.push(file.fileType);
  }

  return parts.join(' • ');
}

export function SessionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [meetingFiles, setMeetingFiles] = useState<MeetingFileItem[]>([]);
  const [isFilesLoading, setIsFilesLoading] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
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
      toast('Не удалось загрузить файлы встречи', 'error');
    } finally {
      setIsFilesLoading(false);
    }
  }

  useEffect(() => {
    if (!id) {
      return;
    }

    void dispatch(fetchMeetingThunk(id));
    void dispatch(fetchParticipantsThunk(id));
    void loadMeetingFiles(id);
  }, [dispatch, id]);

  useEffect(() => {
    document.title = meeting ? `${meeting.title} - Система управления встречами` : 'Встреча - Система управления встречами';
  }, [meeting]);

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
                  <span>участников</span>
                </div>
                <div className="detail-grid__stat">
                  <strong>{meeting.fileCount}</strong>
                  <span>файлов</span>
                </div>
              </div>
            </div>
            <div className="detail-grid__description-card">
              <span className="detail-grid__label">Описание</span>
              <p>{meeting.description || 'Описание встречи пока не заполнено.'}</p>
            </div>
            <div className="detail-grid__facts">
              <div className="detail-grid__fact">
                <span className="detail-grid__label">Локация</span>
                <strong>{meeting.location || 'Не указана'}</strong>
              </div>
              <div className="detail-grid__fact">
                <span className="detail-grid__label">Ссылка на встречу</span>
                <strong>{meeting.meetingLink || 'Не указана'}</strong>
              </div>
              <div className="detail-grid__fact">
                <span className="detail-grid__label">Контактная информация</span>
                <strong>{meeting.contactInfo || 'Не указана'}</strong>
              </div>
              <div className="detail-grid__fact">
                <span className="detail-grid__label">Дата и время</span>
                <strong>{`${formatDate(meeting.date)} • ${formatDateTimeRange(meeting.startTime, meeting.endTime)}`}</strong>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="meeting-files">
            <div className="meeting-files__header">
              <div>
                <span className="detail-grid__label">Файлы встречи</span>
                <h3 className="meeting-files__title">Материалы и вложения</h3>
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

                      if (!file) {
                        return;
                      }

                      setIsUploadingFile(true);

                      try {
                        await sessionsService.uploadMeetingFile(id, file);
                        toast('Файл загружен', 'success');
                        await Promise.all([loadMeetingFiles(id), dispatch(fetchMeetingThunk(id)).unwrap()]);
                      } catch (error) {
                        const message = error instanceof ApiError ? error.message : 'Не удалось загрузить файл';
                        toast(message, 'error');
                      } finally {
                        setIsUploadingFile(false);
                        event.target.value = '';
                      }
                    }}
                  />
                  <Button type="button" variant="secondary" disabled={isUploadingFile} onClick={() => fileInputRef.current?.click()}>
                    {isUploadingFile ? 'Загрузка...' : 'Загрузить файл'}
                  </Button>
                </>
              ) : null}
            </div>

            {isFilesLoading ? <Spinner /> : null}

            {!isFilesLoading && meetingFiles.length === 0 ? (
              <EmptyState title="Файлы пока не добавлены" description="Когда организатор или администратор загрузит материалы, они появятся здесь." />
            ) : null}

            {!isFilesLoading && meetingFiles.length > 0 ? (
              <div className="meeting-files__list">
                {meetingFiles.map((file) => (
                    <div key={file.id} className="meeting-files__item">
                      <div className="meeting-files__item-copy">
                        <strong title={getDisplayFileName(file.fileName)}>{getDisplayFileName(file.fileName)}</strong>
                        {/*<span>{getFileMeta(file)}</span>*/}
                      </div>
                      <div className="meeting-files__actions">
                        <a
                          className="button button--secondary"
                          href={sessionsService.getMeetingFileDownloadUrl(id, file.id)}
                          download={getDisplayFileName(file.fileName)}
                        >
                          Скачать
                        </a>
                        {canManage ? (
                          <Button
                            type="button"
                            variant="danger"
                            onClick={async () => {
                              try {
                                await sessionsService.deleteMeetingFile(id, file.id);
                                toast('Файл удалён', 'success');
                                await Promise.all([loadMeetingFiles(id), dispatch(fetchMeetingThunk(id)).unwrap()]);
                              } catch (error) {
                                const message = error instanceof ApiError ? error.message : 'Не удалось удалить файл';
                                toast(message, 'error');
                              }
                            }}
                          >
                            Удалить
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
              <Button
                type="button"
                variant="danger"
                onClick={async () => {
                  await sessionsService.deleteMeeting(id);
                  toast('Встреча удалена', 'success');
                  navigate('/sessions');
                }}
              >
                Удалить встречу
              </Button>
            }
            onSubmit={async (values) => {
              await sessionsService.updateMeeting(id, {
                title: values.title,
                description: values.description,
                date: new Date(`${values.date}T00:00:00`).toISOString(),
                startTime: toDateTimeString(values.date, values.startTime),
                endTime: toDateTimeString(values.date, values.endTime),
                format: values.format,
                status: values.status,
                location: values.location,
                meetingLink: values.meetingLink,
                contactInfo: values.contactInfo
              });
              toast('Встреча обновлена', 'success');
              await dispatch(fetchMeetingThunk(id)).unwrap();
            }}
          />
        ) : null}
        <ParticipantsPanel
          participants={participants}
          canRespond
          currentUserId={auth.user?.id}
          onRespond={async (status, comment) => {
            if (!auth.user?.id) {
              return;
            }

            await sessionsService.respondToInvitation(id, auth.user.id, { status, comment });
            toast('Ответ на приглашение сохранён', 'success');
            await dispatch(fetchParticipantsThunk(id)).unwrap();
          }}
          onInvite={
            canManage
              ? async (participantIds) => {
                  await sessionsService.inviteParticipants(id, { participantIds });
                  toast('Участники приглашены', 'success');
                  await dispatch(fetchParticipantsThunk(id)).unwrap();
                  await dispatch(fetchMeetingThunk(id)).unwrap();
                }
              : undefined
          }
          onRemove={
            canManage
              ? async (userId) => {
                  await sessionsService.removeParticipant(id, userId);
                  toast('Участник удалён', 'success');
                  await dispatch(fetchParticipantsThunk(id)).unwrap();
                  await dispatch(fetchMeetingThunk(id)).unwrap();
                }
              : undefined
          }
        />
      </div>
    </PageSection>
  );
}
